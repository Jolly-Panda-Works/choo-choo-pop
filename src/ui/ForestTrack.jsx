import { useEffect, useRef } from 'react';
import { MAP_ART } from '../board/sprites.js';
import { difficultyOf, nodeKind } from '../game/levels.js';
import { sfx } from '../audio.js';
import { smoothPath, useWidth, useDragScroll, usePauseOffscreen } from './MapKit.jsx';

// Forest (green) stages: every level is a little panda house on a winding railway, level 1 at the bottom -> 20 at the top.
//   locked -> the house is shown in grey (with a padlock); unlocked -> in colour
//   plaque of the house -> 3 stars: earned ones gold, the rest grey
// Art: art/map/node/*.webp (made from the "house" + "star" deliverables); `plaque` = the empty star board of each house
// in percent of the house picture [x, y, w, h], measured on the art. Stars have the same size on every house
// (CSS: .fn-stars height), only their centre follows the plaque.
const HOUSE = {"house-leaf": {"plaque": [16.74, 86.41, 66.36, 8.36], "aspect": 1.0357}, "house-bamboo": {"plaque": [11.29, 83.29, 77.41, 10.77], "aspect": 1.0771}, "house-flower": {"plaque": [8.51, 85.73, 82.89, 9.08], "aspect": 1.0467}, "house-station": {"plaque": [13.74, 80.09, 73.45, 14.75], "aspect": 1.067}};
// difficulty family (levels.js nodeKind) -> house
const HOUSE_OF = { easy: 'house-leaf', normal: 'house-bamboo', hard: 'house-flower', super: 'house-station' };
const INK = { easy: '#3b9f1c', normal: '#1d93a8', hard: '#c2740a', super: '#7a3fc4' };

// x of each level (percent of the track width); the path winds left <-> right while climbing
const XS = [50, 33, 62, 70, 41, 29, 53, 71, 61, 35, 30, 56, 72, 50, 30, 44, 68, 66, 42, 50];
const NODE_W = 0.36; // house width, in screen widths
const STEP = 0.62; // vertical distance between two houses, in screen widths

const NodeLock = () => (
  <svg className="fn-lock" viewBox="0 0 24 28" width="30" height="34" aria-hidden="true">
    <path d="M6.5 11V8.5a5.5 5.5 0 0111 0V11" fill="none" stroke="#6f7c86" strokeWidth="3.4" strokeLinecap="round" />
    <rect x="3" y="10.5" width="18" height="15" rx="4.5" fill="#fff" stroke="#b7c2c9" strokeWidth="1.3" />
    <circle cx="12" cy="17" r="2.2" fill="#7b8893" />
    <path d="M12 18v3.4" stroke="#7b8893" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

// camera: where the view opens, and how it glides there
const CAM_DELAY = 280; // ms, the houses are already popping in
const CAM_TIME = 950; // ms
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// `leaving` -> the houses fly out (Stage.jsx waits for it, then switches the stage). The component is keyed by stage,
// so every new stage mounts fresh: the houses fly in and the camera glides from the first house to the one to play.
export default function ForestTrack({ levels, unlocked, stars, onPick, label, num, leaving = false }) {
  const wrap = useRef(null);
  const box = useRef(null);
  const w = useWidth(box);
  const nodeW = w * NODE_W;
  const nodeH = nodeW / 1.06; // average house ratio, only used for spacing
  const pad = nodeH * 0.7;
  const total = levels.length;
  const H = pad * 2 + (total - 1) * w * STEP + nodeH;
  // centre of level i (0-based); level 1 is at the bottom
  const pos = (i) => [(XS[i % XS.length] / 100) * w, H - pad - nodeH / 2 - i * w * STEP];
  const pts = levels.map((_, i) => pos(i));

  // the house to play: the player's current level when it is in this stage, otherwise the first house
  const inStage = unlocked >= levels[0] && unlocked <= levels[total - 1];
  const curIdx = inStage ? unlocked - levels[0] : 0;
  const cam = useRef(0);
  const stopCam = () => cancelAnimationFrame(cam.current);
  useEffect(() => {
    const sc = wrap.current;
    if (!sc || !w) return undefined;
    const max = Math.max(0, sc.scrollHeight - sc.clientHeight);
    const at = (i) => Math.max(0, Math.min(max, pts[i][1] - sc.clientHeight * 0.55));
    const from = at(0); // level 1 is at the bottom
    const to = at(curIdx);
    sc.scrollTop = from;
    if (Math.abs(to - from) < 2) return undefined;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (still) {
      sc.scrollTop = to;
      return undefined;
    }
    let t0 = 0;
    const step = (now) => {
      if (!t0) t0 = now;
      const k = Math.min(1, (now - t0) / CAM_TIME);
      sc.scrollTop = from + (to - from) * ease(k);
      if (k < 1) cam.current = requestAnimationFrame(step);
    };
    const id = setTimeout(() => (cam.current = requestAnimationFrame(step)), CAM_DELAY);
    return () => {
      clearTimeout(id);
      stopCam();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w > 0]);
  // mouse drag instead of the scrollbar; taking hold of the view stops the camera glide
  useDragScroll(wrap, 0, stopCam);
  usePauseOffscreen(wrap, '.fn', [levels]);

  const d = w ? smoothPath(pts) : '';
  const tie = Math.max(10, w * 0.09);
  const rail = Math.max(6, w * 0.03);

  return (
    <div className="lv-scroll forest" ref={wrap}>
      <div className={'ft' + (leaving ? ' leaving' : '')} ref={box} style={{ height: w ? H : 0 }}>
        {w > 0 && (
          <svg className="ft-rail" width={w} height={H} viewBox={`0 0 ${w} ${H}`} aria-hidden="true">
            <defs>
              <mask id="ft-gap" maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={H}>
                <path d={d} fill="none" stroke="#fff" strokeWidth={rail * 2.3} strokeLinecap="butt" />
                <path d={d} fill="none" stroke="#000" strokeWidth={rail * 1.05} strokeLinecap="butt" />
              </mask>
            </defs>
            {/* sleepers */}
            <path d={d} fill="none" stroke="#5b3a1c" strokeWidth={tie + 4} strokeDasharray={`${rail * 1.1} ${rail * 2.6}`} strokeLinecap="butt" />
            <path d={d} fill="none" stroke="#b07a43" strokeWidth={tie} strokeDasharray={`${rail * 0.7} ${rail * 3}`} strokeDashoffset={-rail * 0.2} strokeLinecap="butt" />
            {/* the two steel rails (the middle of a thick line is cut out) */}
            <path d={d} fill="none" stroke="#4a5562" strokeWidth={rail * 2.3 + 3} mask="url(#ft-gap)" />
            <path d={d} fill="none" stroke="#dfe6ec" strokeWidth={rail * 2.3} mask="url(#ft-gap)" />
          </svg>
        )}
        {w > 0 &&
          levels.map((n, i) => {
            const kind = nodeKind(difficultyOf(n));
            const house = HOUSE_OF[kind];
            const [px, py] = HOUSE[house].plaque;
            const [, , pw, ph] = HOUSE[house].plaque;
            const locked = n > unlocked;
            const s = stars[n] || 0;
            const here = n === unlocked && !s;
            const [cx, cy] = pos(i);
            const h = nodeW / HOUSE[house].aspect;
            return (
              <div
                key={n}
                className={`fn k-${kind}${locked ? ' locked' : ''}${here ? ' current' : ''}`}
                style={{ left: cx - nodeW / 2, top: cy - h / 2, width: nodeW, height: h, '--c': INK[kind], '--nw': nodeW + 'px', '--i': i, '--r': total - 1 - i, '--side': i % 2 ? 1 : -1 }}
              >
                <button
                  className="fn-btn"
                  disabled={locked}
                  aria-label={`${label} ${i + 1}`}
                  onClick={() => {
                    sfx.click();
                    onPick(n);
                  }}
                >
                  {here && <i className="node-shine" />}
                  {here && <img className="fn-pin" src={`${MAP_ART}ui/pin-panda.webp`} alt="" draggable="false" />}
                  <img className="fn-house" src={`${MAP_ART}node/${house}.webp`} alt="" draggable="false" />
                  <b className="fn-n">{num(i + 1)}</b>
                  {locked && <NodeLock />}
                </button>
                <span className="fn-stars" aria-hidden="true" style={{ left: px + '%', top: py + ph / 2 + '%', width: pw + '%' }}>
                  {[1, 2, 3].map((k) => (
                    <img key={k} src={`${MAP_ART}node/star-${!locked && k <= s ? 'gold' : 'grey'}.webp`} alt="" draggable="false" />
                  ))}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
