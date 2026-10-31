#!/usr/bin/env python3
"""
Unity UI animations (.anim / .controller / .meta)  ->  CSS @keyframes + JSON manifest.

    python3 scripts/convert-unity-anims.py <path-to-Animations-folder> [out-dir=src/anim]

Writes
  <out>/unity-anims.css   one @keyframes + one `.ua-<id>` class per clip (id = folder path + clip name, kebab-case)
  <out>/unity-anims.json  manifest: every clip (duration, loop, channels, sprite-swap curves) and every controller
                          (states -> clip, transitions, default state), so the UI can pick the right clip by state.

How the curves are converted
  * Unity cubic-Hermite curves (value + in/out slope) are sampled and simplified, so the CSS (linear between keys) matches.
  * m_LocalScale.xy      -> scale
    localEulerAnglesBaked.z -> rotate   (Unity is counter-clockwise, CSS clockwise: the sign is flipped)
    m_AnchoredPosition   -> translate   (Unity canvas units * var(--ua-u), y flipped)
    m_Color.a / m_Alpha  -> opacity
  * `path:` of a curve is the child object it animates. Root ("") = the element that has the `.ua-*` class,
    a child path "A/B" = the descendant with  data-ua="A/B"  (see src/anim/ua.js).
  * NOT convertible without extra art (reported in the manifest as `unsupported` / `spriteCurves`):
    m_Sprite (sprite flip-books reference sprite GUIDs, the sprite images were not in the package), m_Color.rgb,
    m_SizeDelta, m_FillAmount, m_Enabled, m_PlayOnAwake.
"""
import glob
import json
import math
import os
import re
import sys

import yaml

SRC = sys.argv[1] if len(sys.argv) > 1 else 'Animations'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'src/anim'


# ---------------------------------------------------------------- Unity YAML
class U(yaml.SafeLoader):
    pass


def _unity_tag(loader, suffix, node):
    if isinstance(node, yaml.MappingNode):
        return loader.construct_mapping(node, deep=True)
    if isinstance(node, yaml.SequenceNode):
        return loader.construct_sequence(node, deep=True)
    return loader.construct_scalar(node)


U.add_multi_constructor('tag:unity3d.com,2011:', _unity_tag)


def load_docs(path):
    text = open(path, encoding='utf-8', errors='ignore').read()
    # '--- !u!74 &7400000' -> keep the file id so controllers can resolve references
    docs = {}
    for m in re.finditer(r'--- !u!(\d+) &(-?\d+)[^\n]*\n(.*?)(?=\n--- !u!|\Z)', text, re.S):
        body = m.group(3)
        try:
            d = yaml.load(body, Loader=U)
        except Exception:
            continue
        docs[m.group(2)] = (int(m.group(1)), d)
    return docs


def num(v, default=0.0):
    try:
        return float(v)
    except Exception:
        return default


def slope(v):
    s = str(v)
    if 'Infinity' in s or 'inf' in s:
        return None  # stepped
    return num(v)


# ---------------------------------------------------------------- curves
def hermite(keys, t):
    if t <= keys[0]['t']:
        return keys[0]['v']
    if t >= keys[-1]['t']:
        return keys[-1]['v']
    for i in range(len(keys) - 1):
        a, b = keys[i], keys[i + 1]
        if a['t'] <= t <= b['t']:
            dt = b['t'] - a['t']
            if dt <= 0:
                return b['v']
            if a['out'] is None or b['in'] is None:
                return a['v']
            s = (t - a['t']) / dt
            s2, s3 = s * s, s * s * s
            return (
                (2 * s3 - 3 * s2 + 1) * a['v']
                + (s3 - 2 * s2 + s) * dt * a['out']
                + (-2 * s3 + 3 * s2) * b['v']
                + (s3 - s2) * dt * b['in']
            )
    return keys[-1]['v']


def read_curve(curve):
    ks = []
    for k in curve['curve']['m_Curve']:
        ks.append({'t': num(k['time']), 'v': num(k['value']), 'in': slope(k['inSlope']), 'out': slope(k['outSlope'])})
    return sorted(ks, key=lambda k: k['t'])


def slug(s):
    s = re.sub(r'[^A-Za-z0-9]+', '-', s).strip('-')
    s = re.sub(r'(?<=[a-z0-9])(?=[A-Z])', '-', s)
    return s.lower()


def fmt(v, nd=4):
    r = round(v, nd)
    if r == 0:
        r = 0.0
    return ('%.*f' % (nd, r)).rstrip('0').rstrip('.') or '0'


CHANNELS = {
    'm_LocalScale.x': 'sx',
    'm_LocalScale.y': 'sy',
    'localEulerAnglesBaked.z': 'rz',
    'm_LocalEulerAngles.z': 'rz',
    'localEulerAngles.z': 'rz',
    'm_AnchoredPosition.x': 'px',
    'm_AnchoredPosition.y': 'py',
    'm_Color.a': 'a',
    'm_Alpha': 'a',
}
IGNORED = {'m_LocalScale.z', 'm_LocalPosition.z', 'm_LocalRotation.x', 'm_LocalRotation.y', 'm_LocalRotation.z', 'm_LocalRotation.w',
           'localEulerAnglesBaked.x', 'localEulerAnglesBaked.y'}


def collect(clip):
    """-> { path: { channel: keys } }, unsupported attributes, sprite curves"""
    per = {}
    unsupported = set()
    seen = set()
    for listname in ('m_EditorCurves', 'm_EulerEditorCurves', 'm_FloatCurves'):
        for c in clip.get(listname) or []:
            attr = str(c.get('attribute'))
            path = c.get('path') or ''
            key = (path, attr)
            if key in seen:
                continue
            seen.add(key)
            if attr in IGNORED:
                continue
            ch = CHANNELS.get(attr)
            if not ch:
                unsupported.add(attr)
                continue
            try:
                ks = read_curve(c)
            except Exception:
                continue
            if ks:
                per.setdefault(path, {})[ch] = ks
    sprites = []
    for c in clip.get('m_PPtrCurves') or []:
        frames = [{'t': num(f['time']), 'guid': (f.get('value') or {}).get('guid')} for f in c.get('curve', [])]
        sprites.append({'path': c.get('path') or '', 'attribute': c.get('attribute'), 'frames': frames})
    return per, sorted(unsupported), sprites


def simplify(frames, names, tol):
    """drop key-frames that linear interpolation reproduces"""
    if len(frames) <= 2:
        return frames
    keep = [0]
    for i in range(1, len(frames) - 1):
        a, b, c = frames[keep[-1]], frames[i], frames[i + 1]
        ok = True
        f = (b['t'] - a['t']) / ((c['t'] - a['t']) or 1)
        for n in names:
            pred = a[n] + (c[n] - a[n]) * f
            if abs(pred - b[n]) > tol[n]:
                ok = False
                break
        if not ok:
            keep.append(i)
    keep.append(len(frames) - 1)
    return [frames[i] for i in keep]


def build_keyframes(chs, duration):
    names = sorted(chs.keys())
    times = {0.0, duration}
    for ks in chs.values():
        for k in ks:
            if 0 <= k['t'] <= duration + 1e-6:
                times.add(round(k['t'], 5))
    # 30 samples per second between keys keeps the Hermite shape
    base = sorted(times)
    grid = set(base)
    for a, b in zip(base, base[1:]):
        n = max(1, int(math.ceil((b - a) * 30)))
        for i in range(1, n):
            grid.add(round(a + (b - a) * i / n, 5))
    frames = []
    for t in sorted(grid):
        fr = {'t': t}
        for n in names:
            fr[n] = hermite(chs[n], t)
        frames.append(fr)
    tol = {}
    for n in names:
        vals = [f[n] for f in frames]
        span = (max(vals) - min(vals)) or 1.0
        tol[n] = span * 0.004
    return simplify(frames, names, tol), names


def css_for(frames, names, dur):
    out = []
    for f in frames:
        pct = 0 if dur <= 0 else f['t'] / dur * 100
        decl = []
        if 'sx' in names or 'sy' in names:
            sx = f.get('sx', f.get('sy', 1))
            sy = f.get('sy', f.get('sx', 1))
            decl.append('scale:%s %s' % (fmt(sx), fmt(sy)))
        if 'rz' in names:
            decl.append('rotate:%sdeg' % fmt(-f['rz'], 3))
        if 'px' in names or 'py' in names:
            decl.append('translate:calc(%s * var(--ua-u,1px)) calc(%s * var(--ua-u,1px))' % (fmt(f.get('px', 0), 2), fmt(-f.get('py', 0), 2)))
        if 'a' in names:
            decl.append('opacity:%s' % fmt(max(0.0, min(1.0, f['a'])), 3))
        out.append('%s%%{%s}' % (fmt(pct, 2), ';'.join(decl)))
    return ''.join(out)


# ---------------------------------------------------------------- main
def main():
    metas = {}
    for m in glob.glob(os.path.join(SRC, '**', '*.meta'), recursive=True):
        t = open(m, encoding='utf-8', errors='ignore').read()
        g = re.search(r'^guid: ([0-9a-f]+)', t, re.M)
        if g:
            metas[g.group(1)] = os.path.relpath(m[:-5], SRC)

    css = [
        '/* Generated by scripts/convert-unity-anims.py from the Unity "Animations" package. Do not edit by hand.',
        '   Usage: class "ua ua-<clip-id>" on the element (see src/anim/ua.js and unity-anims.json). */',
        ':root{--ua-u:.36px}',
        '.ua{animation-fill-mode:both;animation-timing-function:linear}',
        '@media (prefers-reduced-motion:reduce){.ua{animation:none!important}}',
    ]
    manifest = {'clips': {}, 'controllers': {}}
    guid_to_id = {}

    for f in sorted(glob.glob(os.path.join(SRC, '**', '*.anim'), recursive=True)):
        rel = os.path.relpath(f, SRC)
        docs = load_docs(f)
        clip = next((d for _, (k, d) in docs.items() if k == 74), None)
        if not clip:
            continue
        clip = clip.get('AnimationClip', clip)
        cid = slug(rel[:-5].replace('/', '-').replace('\\', '-'))
        st = clip.get('m_AnimationClipSettings', {})
        dur = max(0.001, num(st.get('m_StopTime')) - num(st.get('m_StartTime')))
        loop = bool(int(num(st.get('m_LoopTime'))))
        per, unsupported, sprites = collect(clip)
        paths = []
        for path, chs in sorted(per.items()):
            frames, names = build_keyframes(chs, dur)
            kf = 'ua-%s%s' % (cid, '' if path == '' else '--' + slug(path))
            css.append('@keyframes %s{%s}' % (kf, css_for(frames, names, dur)))
            paths.append({'path': path, 'keyframes': kf, 'channels': names})
        # rule: root path on the element, children on [data-ua="path"]
        timing = '%ss linear both%s' % (fmt(dur, 3), ' infinite' if loop else '')
        for p in paths:
            sel = '.ua-%s' % cid if p['path'] == '' else '.ua-%s [data-ua="%s"]' % (cid, p['path'])
            css.append('%s{animation:%s %s;transform-origin:50%% 50%%}' % (sel, p['keyframes'], timing))
        meta_name = metas.get  # noqa
        g = None
        mp = f + '.meta'
        if os.path.exists(mp):
            gm = re.search(r'^guid: ([0-9a-f]+)', open(mp, encoding='utf-8', errors='ignore').read(), re.M)
            g = gm.group(1) if gm else None
        if g:
            guid_to_id[g] = cid
        manifest['clips'][cid] = {
            'file': rel,
            'name': clip.get('m_Name'),
            'duration': round(dur, 4),
            'loop': loop,
            'paths': paths,
            'unsupported': unsupported,
            'spriteCurves': sprites,
        }

    # ---- controllers: state -> clip
    for f in sorted(glob.glob(os.path.join(SRC, '**', '*.controller'), recursive=True)):
        rel = os.path.relpath(f, SRC)
        docs = load_docs(f)
        states = {}
        machines = {}
        params = []
        for fid, (kind, d) in docs.items():
            if kind == 91:
                ac = d.get('AnimatorController', d)
                params = [p.get('m_Name') for p in ac.get('m_AnimatorParameters') or []]
            elif kind == 1102:
                states[fid] = d.get('AnimatorState', d)
            elif kind == 1107:
                machines[fid] = d.get('AnimatorStateMachine', d)
        out_states = []
        default = None
        for mid, sm in machines.items():
            dfl = str((sm.get('m_DefaultState') or {}).get('fileID'))
            for cs in sm.get('m_ChildStates') or []:
                sid = str((cs.get('m_State') or {}).get('fileID'))
                s = states.get(sid)
                if not s:
                    continue
                guid = (s.get('m_Motion') or {}).get('guid')
                clip_id = guid_to_id.get(guid)
                trans = []
                for tid in s.get('m_Transitions') or []:
                    td = docs.get(str((tid or {}).get('fileID')))
                    if not td:
                        continue
                    t = td[1].get('AnimatorStateTransition', td[1])
                    dst = states.get(str((t.get('m_DstState') or {}).get('fileID')))
                    trans.append({
                        'to': dst.get('m_Name') if dst else None,
                        'conditions': [{'param': c.get('m_ConditionEvent'), 'value': c.get('m_EventTreshold')} for c in t.get('m_Conditions') or []],
                        'hasExitTime': bool(int(num(t.get('m_HasExitTime')))),
                    })
                out_states.append({'name': s.get('m_Name'), 'clip': clip_id, 'transitions': trans})
                if sid == dfl:
                    default = s.get('m_Name')
        manifest['controllers'][slug(rel[:-11].replace('/', '-').replace('\\', '-'))] = {
            'file': rel,
            'parameters': params,
            'default': default,
            'states': out_states,
        }

    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, 'unity-anims.css'), 'w') as fh:
        fh.write('\n'.join(css) + '\n')
    with open(os.path.join(OUT, 'unity-anims.json'), 'w') as fh:
        json.dump(manifest, fh, indent=1, ensure_ascii=False)
    n_sprite = sum(1 for c in manifest['clips'].values() if c['spriteCurves'])
    print('clips: %d  (css only: %d, with sprite swaps: %d)  controllers: %d' % (len(manifest['clips']), len(manifest['clips']) - n_sprite, n_sprite, len(manifest['controllers'])))
    print('css size: %d KB' % (os.path.getsize(os.path.join(OUT, 'unity-anims.css')) // 1024))


main()
