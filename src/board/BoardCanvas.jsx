import { useEffect, useRef } from 'react';
import { EDITION } from '../config.js';
import { formatNumber } from '../i18n.js';
import { SIDE_VEC, pathConnections, stepOnto, dirBetween } from '../game/logic.js';
import { mulberry32 } from '../game/rng.js';
import { buildRoute, sampleRoute } from './route.js';
import { getSprites, getTrainSet } from './sprites.js';

// Strict top-down 2D board drawn on a canvas with the PNG sprites from art/.
// World units: 1 = one cell, x = east, y = south, origin = board centre.

// Merkin (display) / Vazirmatn (Persian glyphs, the new fonts have no Arabic letters). Merkin only has a regular weight.
const FONT =
  EDITION === 'fa'
    ? '"Merkin", "Vazirmatn Variable", system-ui, sans-serif'
    : '"Merkin", "Cabin", "Trebuchet MS", system-ui, sans-serif';
const FONT_W = EDITION === 'fa' ? 900 : 400;

// Tunnel gates: a capsule lying across the track just outside the board edge.
const GATE_W = 1.06; // length of the capsule across the track (cells)
const GATE_OUT = 0.17; // gate centre this far beyond the board edge (cells); the train is cut at this plane
const GATE_EXTENT = GATE_OUT + 0.27; // how far the gate reaches out from the edge, for the layout
const CAR_LEN = 0.84;
const CAR_GAP = 0.9;
export const TRAIN_LENGTH = CAR_GAP * 4;
const RUN_SPEED = 8; // cells per second

// number badges: the glossy map-stage buttons (yellow = still counting, green = done, pink = too many)
const CLUE = {
  normal: { btn: 'btnYellow', stroke: '#fff6c9', fg: '#8a4b12' },
  ok: { btn: 'btnGreen', stroke: '#3f8f1c', fg: '#ffffff' },
  over: { btn: 'btnPink', stroke: '#b8304f', fg: '#ffffff' },
};
const lineState = (count, clue) => (count === clue ? 'ok' : count > clue ? 'over' : 'normal');

function layoutFor(level, W, H, reserveBottom) {
  const { rows, cols } = level;
  const has = [false, false, false, false];
  has[level.entry.side] = true;
  has[level.exit.side] = true;
  // column numbers sit above the board, row numbers right of it; a tunnel on that side pushes them further out
  const topClue = -rows / 2 - (has[0] ? GATE_EXTENT + 0.62 : 0.82);
  const rightClue = cols / 2 + (has[1] ? GATE_EXTENT + 0.62 : 0.82);
  const minX = -cols / 2 - (has[3] ? GATE_EXTENT + 0.16 : 0.24);
  const maxX = rightClue + 0.4;
  const minY = topClue - 0.4;
  const maxY = rows / 2 + (has[2] ? GATE_EXTENT + 0.16 : 0.24);
  const availH = Math.max(80, H - reserveBottom);
  const pad = 12;
  const S = Math.max(10, Math.min((W - pad * 2) / (maxX - minX), (availH - pad * 2) / (maxY - minY), 100));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return { S, ox: W / 2 - cx * S, oy: availH / 2 - cy * S, topClue, rightClue, box: { minX, maxX, minY, maxY } };
}

/** Trees, bushes and flowers on the grass around the board (seeded per level so they never jump). */
function makeDecor(level, lay, W, H) {
  const rng = mulberry32(level.id * 977 + 13);
  const { S, ox, oy, box } = lay;
  const keep = {
    x0: ox + box.minX * S - 0.3 * S,
    x1: ox + box.maxX * S + 0.3 * S,
    y0: oy + box.minY * S - 0.3 * S,
    y1: oy + box.maxY * S + 0.3 * S,
  };
  const out = [];
  const step = Math.max(46, S * 1.15);
  for (let y = -step * 0.4; y < H + step; y += step) {
    for (let x = -step * 0.4; x < W + step; x += step) {
      const px = x + (rng() - 0.5) * step * 0.7;
      const py = y + (rng() - 0.5) * step * 0.7;
      const kind = rng();
      const size = kind < 0.28 ? S * 1.35 : kind < 0.5 ? S * 0.95 : S * 0.62;
      const half = size * 0.5;
      if (px + half > keep.x0 && px - half < keep.x1 && py + half > keep.y0 && py - half < keep.y1) continue;
      if (rng() < 0.28) continue;
      const k = kind < 0.28 ? 'tree' : kind < 0.5 ? 'bush' : rng() < 0.5 ? 'flowerPink' : 'flowerYellow';
      out.push({ k, x: px, y: py, size, flip: rng() < 0.5 });
    }
  }
  out.sort((a, b) => a.y - b.y);
  return out;
}

const pieceTurns = (a, b) => {
  // straight: base is W-E
  if (b !== -1 && (a + 2) % 4 === b) return { kind: 'straight', k: a % 2 === 1 ? 0 : 1 };
  if (b === -1) return { kind: 'half', k: (a + 1) % 4 };
  // curve: base connects W(3) and N(0); a quarter turn clockwise moves W->N and N->E
  for (let k = 0; k < 4; k++) {
    const s = [(3 + k) % 4, k % 4];
    if (s.includes(a) && s.includes(b)) return { kind: 'curve', k };
  }
  return { kind: 'straight', k: 0 };
};

function drawTile(g, img, cx, cy, S, k, scale = 1) {
  g.save();
  g.translate(cx, cy);
  g.rotate((k * Math.PI) / 2);
  g.drawImage(img, (-S * scale) / 2, (-S * scale) / 2, S * scale, S * scale);
  g.restore();
}

function drawFinger(g, x, y, scale, pressed) {
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  g.beginPath();
  g.arc(0, 0, pressed ? 36 : 44, 0, Math.PI * 2);
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.fill();
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const part = (fn) => {
    g.beginPath();
    fn();
    g.fillStyle = '#ffd0a6';
    g.fill();
    g.lineWidth = 7;
    g.strokeStyle = '#b5683a';
    g.stroke();
  };
  part(() => g.roundRect(-38, 34, 92, 78, 30));
  part(() => g.roundRect(-62, 52, 40, 24, 12));
  part(() => g.roundRect(-17, -6, 34, 100, 17));
  g.restore();
}

function draw(R, now) {
  const { g, W, H, level, lay } = R;
  const sp = getSprites();
  if (!g || !sp || !level || !lay) return;
  const { S, ox, oy } = lay;
  const { rows, cols } = level;
  g.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  const px = (x) => ox + x * S;
  const py = (y) => oy + y * S;
  const won = R.phase === 'run' || R.phase === 'won';

  // --- tunnel gates (green = entry, red = exit)
  // Sprite frame: the capsule lies across the track, the arrow shows the travel direction (entry: up, exit: down).
  // Entry arrow -> into the board, exit arrow -> out of the board, whatever side of the board the gate sits on.
  const gateOf = (which) => {
    const info = level[which];
    const [vx, vy] = SIDE_VEC[info.side];
    const dist = 0.5 + GATE_OUT;
    const dir = which === 'entry' ? [-vx, -vy] : [vx, vy];
    const base = which === 'entry' ? -Math.PI / 2 : Math.PI / 2;
    return {
      which,
      vx,
      vy,
      cx: px(info.c - cols / 2 + 0.5 + vx * dist),
      cy: py(info.r - rows / 2 + 0.5 + vy * dist),
      rot: Math.atan2(dir[1], dir[0]) - base,
    };
  };
  const gates = [gateOf('entry'), gateOf('exit')];
  // keep only the board side of a gate's plane (everything beyond the gate centre is hidden)
  const clipInside = (gt) => {
    const ang = Math.atan2(gt.vy, gt.vx);
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const B = 6000;
    const pt = (lx, ly) => [gt.cx + lx * c - ly * s, gt.cy + lx * s + ly * c];
    const [a, b, d, e] = [pt(-B, -B), pt(0, -B), pt(0, B), pt(-B, B)];
    g.beginPath();
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
    g.lineTo(d[0], d[1]);
    g.lineTo(e[0], e[1]);
    g.closePath();
    g.clip();
  };
  const drawGate = (gt) => {
    const sprite = sp[gt.which];
    const t = sp[gt.which + 'Trim'];
    const k = (GATE_W * S) / t.w;
    g.save();
    g.translate(gt.cx, gt.cy);
    g.rotate(gt.rot);
    g.shadowColor = 'rgba(10,50,70,0.4)';
    g.shadowBlur = S * 0.12;
    g.shadowOffsetY = S * 0.05;
    g.drawImage(sprite, -(t.x + t.w / 2) * k, -(t.y + t.h / 2) * k, sprite.width * k, sprite.height * k);
    g.restore();
  };

  // --- decoration on the grass
  for (const d of R.decor) {
    const img = sp[d.k];
    const w = d.size;
    const h = (img.height / img.width) * w;
    g.save();
    g.translate(d.x, d.y);
    if (d.flip) g.scale(-1, 1);
    g.globalAlpha = 0.96;
    g.drawImage(img, -w / 2, -h / 2, w, h);
    g.restore();
  }

  // --- board frame
  const bx = px(-cols / 2) - 0.17 * S;
  const by = py(-rows / 2) - 0.17 * S;
  const bw = cols * S + 0.34 * S;
  const bh = rows * S + 0.34 * S;
  g.save();
  g.shadowColor = 'rgba(10,70,90,0.38)';
  g.shadowBlur = S * 0.22;
  g.shadowOffsetY = S * 0.1;
  g.beginPath();
  g.roundRect(bx, by, bw, bh, S * 0.2);
  g.fillStyle = '#ffffff'; // white candy rim, like the map-stage buttons
  g.fill();
  g.restore();
  g.beginPath();
  g.roundRect(bx + S * 0.035, by + S * 0.035, bw - S * 0.07, bh - S * 0.07, S * 0.17);
  g.strokeStyle = '#bfe3ea';
  g.lineWidth = S * 0.05;
  g.stroke();

  // --- cells
  const inPath = new Set(R.path);
  const givenSet = new Set(level.given);
  g.save();
  g.beginPath();
  g.roundRect(px(-cols / 2), py(-rows / 2), cols * S, rows * S, S * 0.08);
  g.clip();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x = px(c - cols / 2);
      const y = py(r - rows / 2);
      const img = inPath.has(i) ? sp.ground : (r + c) % 2 ? sp.grassA : sp.grassB;
      g.drawImage(img, x, y, S + 0.6, S + 0.6);
      if (inPath.has(i) && won) {
        g.fillStyle = 'rgba(120,230,130,0.35)';
        g.fillRect(x, y, S + 0.6, S + 0.6);
      }
      if (givenSet.has(i)) {
        g.fillStyle = 'rgba(255,226,90,0.3)';
        g.fillRect(x, y, S + 0.6, S + 0.6);
      }
    }
  }
  // soft grid lines
  g.strokeStyle = 'rgba(30,90,30,0.14)';
  g.lineWidth = 1;
  g.beginPath();
  for (let r = 1; r < rows; r++) {
    g.moveTo(px(-cols / 2), py(r - rows / 2));
    g.lineTo(px(cols / 2), py(r - rows / 2));
  }
  for (let c = 1; c < cols; c++) {
    g.moveTo(px(c - cols / 2), py(-rows / 2));
    g.lineTo(px(c - cols / 2), py(rows / 2));
  }
  g.stroke();
  g.restore();

  // --- gold star tiles
  const bob = 1 + 0.04 * Math.sin(now / 350);
  for (const gi of level.given) {
    const x = px((gi % cols) - cols / 2 + 0.5);
    const y = py(Math.floor(gi / cols) - rows / 2 + 0.5);
    const s = S * 0.72 * (inPath.has(gi) ? 0.9 : bob);
    g.globalAlpha = inPath.has(gi) ? 0.55 : 1;
    g.drawImage(sp.starShadow, x - s / 2, y - s / 2 + s * 0.06, s, s * (380 / 400));
    g.drawImage(sp.starGold, x - s / 2, y - s / 2, s, s * (380 / 400));
    g.globalAlpha = 1;
  }

  // --- rails
  const conns = pathConnections(level, R.path);
  const seen = new Set();
  R.path.forEach((cell, i) => {
    seen.add(cell);
    if (!R.appear.has(cell)) R.appear.set(cell, now);
    const age = Math.min(1, (now - R.appear.get(cell)) / 170);
    const e = 1 - Math.pow(1 - age, 3);
    const [a, b] = conns[i];
    const { kind, k } = pieceTurns(a, b);
    const cx = px((cell % cols) - cols / 2 + 0.5);
    const cy = py(Math.floor(cell / cols) - rows / 2 + 0.5);
    const img = kind === 'curve' ? sp.curve : kind === 'half' ? sp.half : sp.straight;
    drawTile(g, img, cx, cy, S + 0.5, k, 0.6 + 0.4 * e);
  });
  for (const key of [...R.appear.keys()]) if (!seen.has(key)) R.appear.delete(key);

  // --- numbers
  const drawClue = (n, state, wx, wy, pulse) => {
    const st = CLUE[state];
    const x = px(wx);
    const y = py(wy);
    const rad = S * 0.3;
    const img = sp[st.btn];
    const w = rad * 2 * 1.36; // the sprite includes its white rim and base plate
    const h = w * (370 / 380);
    g.drawImage(img, x - w / 2, y - h * 0.46, w, h);
    g.font = `${FONT_W} ${S * 0.4}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = S * 0.085;
    g.strokeStyle = st.stroke;
    const label = formatNumber(n);
    if (state !== 'normal') g.strokeText(label, x, y + S * 0.02);
    g.fillStyle = st.fg;
    g.fillText(label, x, y + S * 0.02);
    if (pulse) {
      const k = 1 + 0.14 * Math.sin(now / 200);
      g.beginPath();
      g.arc(x, y, rad * 1.3 * k, 0, Math.PI * 2);
      g.lineWidth = S * 0.06;
      g.strokeStyle = '#ff9f1a';
      g.stroke();
    }
  };
  level.colClues.forEach((n, c) =>
    drawClue(n, lineState(R.counts.cols[c], n), c - cols / 2 + 0.5, lay.topClue, R.coach?.clues),
  );
  level.rowClues.forEach((n, r) =>
    drawClue(n, lineState(R.counts.rows[r], n), lay.rightClue, r - rows / 2 + 0.5, R.coach?.clues),
  );
  if (R.coach?.star) {
    for (const gi of level.given) {
      const k = 1 + 0.14 * Math.sin(now / 200);
      g.beginPath();
      g.arc(px((gi % cols) - cols / 2 + 0.5), py(Math.floor(gi / cols) - rows / 2 + 0.5), S * 0.5 * k, 0, Math.PI * 2);
      g.lineWidth = S * 0.07;
      g.strokeStyle = '#ff9f1a';
      g.stroke();
    }
  }

  // --- train: exists only between the two gates (cut at the gate planes, the gates are drawn on top of it)
  if (R.phase === 'run' && R.route && !R.done) {
    const set = getTrainSet(R.skin);
    const rt = R.route;
    // the run starts with the engine just behind the entry gate, completely hidden
    const d = rt.gateIn - 0.45 + ((now - R.runStart) / 1000) * RUN_SPEED;
    if (d - 3 * CAR_GAP - CAR_LEN * 0.5 > rt.gateOut) {
      R.done = true; // the last wagon has disappeared into the exit gate
      R.onRunDone?.();
    } else {
      // smoke from the chimney, only while the engine is between the gates
      if (now - R.lastPuff > 75 && d > rt.gateIn && d < rt.gateOut) {
        const head = sampleRoute(rt, d);
        R.lastPuff = now;
        R.puffs.push({
          x: head.x + Math.cos(head.ang) * 0.2,
          y: head.z + Math.sin(head.ang) * 0.2,
          born: now,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -0.35 - Math.random() * 0.3,
        });
      }
      g.save();
      clipInside(gates[0]);
      clipInside(gates[1]);
      for (let i = 3; i >= 0; i--) {
        const dd = d - i * CAR_GAP;
        if (dd < 0 || dd > rt.total - 0.05) continue;
        const s = sampleRoute(rt, dd);
        const img = i === 0 ? set.engine : set.wagons[i - 1];
        const t = i === 0 ? sp.engineTrim : sp.wagonTrim;
        const k = (CAR_LEN * S) / t.w;
        g.save();
        g.translate(px(s.x), py(s.z));
        g.rotate(s.ang);
        g.shadowColor = 'rgba(30,20,10,0.3)';
        g.shadowBlur = S * 0.1;
        g.shadowOffsetY = S * 0.04;
        g.drawImage(img, -(t.x + t.w / 2) * k, -(t.y + t.h / 2) * k, img.width * k, img.height * k);
        g.restore();
      }
      g.restore();
    }
  }
  R.puffs = R.puffs.filter((p) => now - p.born < 800);
  for (const p of R.puffs) {
    const age = (now - p.born) / 800;
    const x = px(p.x + p.vx * age);
    const y = py(p.y + p.vy * age);
    const s = S * (0.22 + 0.4 * age);
    g.globalAlpha = 0.9 * (1 - age);
    g.drawImage(sp.smoke, x - s / 2, y - s / 2, s, s);
  }
  g.globalAlpha = 1;

  // --- gates on top: the train comes out of / goes into them
  for (const gt of gates) drawGate(gt);

  // --- coach finger (always on top)
  const gh = R.coach?.ghost;
  if (gh && gh.cells.length) {
    const pts = gh.cells.map((cell) => [(cell % cols) - cols / 2 + 0.5, Math.floor(cell / cols) - rows / 2 + 0.5]);
    const speed = gh.kind === 'next' ? 1.1 : 1.6;
    const hold = 0.55;
    const total = Math.max(1, pts.length - 1) / speed;
    const cycle = total + hold * 2;
    const tt = (now / 1000) % cycle;
    let p = 0;
    if (tt > hold) p = Math.min(1, (tt - hold) / total) * (pts.length - 1);
    const i = Math.max(0, Math.min(pts.length - 2, Math.floor(p)));
    const f = pts.length > 1 ? p - i : 0;
    const a = pts[i];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const e = f * f * (3 - 2 * f);
    const pressed = tt > hold * 0.4 && tt < cycle - hold * 0.4;
    drawFinger(g, px(a[0] + (b[0] - a[0]) * e), py(a[1] + (b[1] - a[1]) * e), ((pressed ? 0.92 : 1.12) * 1.25 * S) / 256, pressed);
  }
}

export default function BoardCanvas({ level, path, pathRef, evalResult, phase, coach, skin, reserveBottom = 0, onPath, onRunDone }) {
  const wrapRef = useRef(null);
  const cvRef = useRef(null);
  const R = useRef({
    appear: new Map(),
    puffs: [],
    lastPuff: 0,
    decor: [],
    dirty: true,
    ready: false,
    path: [],
    counts: { rows: [], cols: [] },
    phase: 'play',
  });
  const cbRef = useRef({});
  cbRef.current = { onPath, onRunDone, pathRef, level, reserveBottom };

  // keep the draw state in sync with props
  useEffect(() => {
    const r = R.current;
    const levelChanged = r.level !== level;
    r.level = level;
    r.path = path;
    r.counts = evalResult.counts;
    r.coach = coach;
    r.skin = skin;
    r.onRunDone = () => cbRef.current.onRunDone?.();
    if (phase === 'run' && r.phase !== 'run') {
      r.route = buildRoute(level, pathConnections(level, path), path, GATE_OUT);
      r.runStart = performance.now();
      r.done = false;
      r.puffs = [];
    }
    if (phase === 'play') {
      r.route = null;
      r.done = false;
    }
    r.phase = phase;
    if (levelChanged && r.W) {
      r.lay = layoutFor(level, r.W, r.H, reserveBottom);
      r.decor = makeDecor(level, r.lay, r.W, r.H);
      r.appear = new Map();
    }
    r.dirty = true;
  }, [level, path, evalResult, phase, coach, skin, reserveBottom]);

  // size + render loop
  useEffect(() => {
    const cv = cvRef.current;
    const wrap = wrapRef.current;
    const r = R.current;
    r.g = cv.getContext('2d');
    if (import.meta.env.DEV) window.__board = r; // dev/test hook
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      r.W = Math.max(1, rect.width);
      r.H = Math.max(1, rect.height);
      r.dpr = dpr;
      cv.width = Math.round(r.W * dpr);
      cv.height = Math.round(r.H * dpr);
      const lv = cbRef.current.level;
      r.lay = layoutFor(lv, r.W, r.H, cbRef.current.reserveBottom);
      r.decor = makeDecor(lv, r.lay, r.W, r.H);
      r.dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    r.ready = true;
    let raf;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      const animating =
        r.coach || r.phase === 'run' || r.puffs.length > 0 || r.level?.given.length > 0 ||
        [...r.appear.values()].some((t0) => t - t0 < 220);
      if (!r.dirty && !animating) return;
      r.dirty = false;
      draw(r, t);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // --- touch / mouse input
  const drag = useRef(null);
  const world = (e) => {
    const rect = cvRef.current.getBoundingClientRect();
    const { lay } = R.current;
    return [(e.clientX - rect.left - lay.ox) / lay.S, (e.clientY - rect.top - lay.oy) / lay.S];
  };
  const cellAt = (x, y) => {
    const lv = cbRef.current.level;
    const c = Math.floor(x + lv.cols / 2);
    const r = Math.floor(y + lv.rows / 2);
    return r < 0 || c < 0 || r >= lv.rows || c >= lv.cols ? -1 : r * lv.cols + c;
  };
  const sample = (x, y) => {
    const cell = cellAt(x, y);
    if (cell === -1) return;
    const { level: lv, pathRef: pr, onPath: op } = cbRef.current;
    const next = stepOnto(lv, pr.current, cell);
    if (next !== pr.current) {
      pr.current = next;
      op(next);
    }
  };
  const enabled = phase === 'play';
  const onDown = (e) => {
    if (!enabled) return;
    const [x, y] = world(e);
    const cell = cellAt(x, y);
    if (cell === -1) return;
    const { level: lv, pathRef: pr } = cbRef.current;
    const p = pr.current;
    const head = p[p.length - 1];
    if (!(p.includes(cell) || dirBetween(lv, head, cell) !== -1)) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { x, y };
    sample(x, y);
  };
  const onMove = (e) => {
    if (!drag.current || !enabled) return;
    const [x, y] = world(e);
    const n = Math.max(1, Math.ceil(Math.hypot(x - drag.current.x, y - drag.current.y) / 0.2));
    for (let i = 1; i <= n; i++) sample(drag.current.x + ((x - drag.current.x) * i) / n, drag.current.y + ((y - drag.current.y) * i) / n);
    drag.current = { x, y };
  };
  const onUp = () => (drag.current = null);

  return (
    <div ref={wrapRef} className="board-canvas">
      <canvas
        ref={cvRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{ touchAction: 'none', width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
