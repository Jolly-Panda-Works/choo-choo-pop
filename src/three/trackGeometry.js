import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SIDE_VEC } from '../game/logic.js';

const mid = (s) => [SIDE_VEC[s][0] * 0.5, SIDE_VEC[s][1] * 0.5];

/**
 * Local curve inside one cell (x = east, z = south, cell centre = 0,0, size 1).
 * Goes from the middle of side `a` to the middle of side `b`
 * (b === -1: open end, runs from side `a` to the cell centre).
 * Returns { p(t) -> [x,z], tan(t) -> [x,z] }.
 */
export function localCurve(a, b) {
  const A = mid(a);
  if (b === -1) {
    return { p: (t) => [A[0] * (1 - t), A[1] * (1 - t)], tan: () => [-A[0], -A[1]] };
  }
  const B = mid(b);
  if ((a + 2) % 4 === b) {
    return { p: (t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t], tan: () => [B[0] - A[0], B[1] - A[1]] };
  }
  const corner = [A[0] + B[0], A[1] + B[1]];
  const v0 = [-B[0], -B[1]];
  const v1 = [-A[0], -A[1]];
  const k = Math.PI / 2;
  return {
    p: (t) => {
      const c = Math.cos(t * k);
      const s = Math.sin(t * k);
      return [corner[0] + v0[0] * c + v1[0] * s, corner[1] + v0[1] * c + v1[1] * s];
    },
    tan: (t) => {
      const c = Math.cos(t * k);
      const s = Math.sin(t * k);
      return [(-v0[0] * s + v1[0] * c) * k, (-v0[1] * s + v1[1] * c) * k];
    },
  };
}

const cache = new Map();

function placeBox(w, h, d, cx, cy, cz, angle) {
  const g = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Matrix4().makeRotationY(-angle);
  m.setPosition(cx, cy, cz);
  g.applyMatrix4(m);
  return g;
}

/** Cached { sleepers, rails } geometries for a piece connecting sides a -> b. */
export function getPieceGeometry(a, b) {
  const lo = b === -1 ? a : Math.min(a, b);
  const hi = b === -1 ? -1 : Math.max(a, b);
  const key = lo + ':' + hi;
  if (cache.has(key)) return cache.get(key);

  const curve = localCurve(lo, hi);
  const straight = hi !== -1 && (lo + 2) % 4 === hi;
  const open = hi === -1;
  const segs = straight || open ? 2 : 9;
  const sleeperCount = open ? 2 : straight ? 4 : 5;
  const railGap = 0.15;
  const railParts = [];
  const sleeperParts = [];

  for (let i = 0; i < segs; i++) {
    const p0 = curve.p(i / segs);
    const p1 = curve.p((i + 1) / segs);
    const dx = p1[0] - p0[0];
    const dz = p1[1] - p0[1];
    const len = Math.hypot(dx, dz);
    const ang = Math.atan2(dz, dx);
    const nx = -dz / len;
    const nz = dx / len;
    for (const side of [-1, 1]) {
      const cx = (p0[0] + p1[0]) / 2 + nx * railGap * side;
      const cz = (p0[1] + p1[1]) / 2 + nz * railGap * side;
      railParts.push(placeBox(len + 0.012, 0.06, 0.05, cx, 0.17, cz, ang));
    }
  }
  for (let i = 0; i < sleeperCount; i++) {
    const t = (i + 0.5) / sleeperCount;
    const p = curve.p(t);
    const tg = curve.tan(t);
    const ang = Math.atan2(tg[1], tg[0]);
    // long side of the sleeper is across the track -> rotate a quarter turn
    sleeperParts.push(placeBox(0.1, 0.05, 0.46, p[0], 0.13, p[1], ang));
  }
  const geo = {
    sleepers: mergeGeometries(sleeperParts),
    rails: mergeGeometries(railParts),
  };
  sleeperParts.forEach((g) => g.dispose());
  railParts.forEach((g) => g.dispose());
  cache.set(key, geo);
  return geo;
}

/** World-space polyline (with lead-in / lead-out) used to run the train. */
export function buildRoute(level, conns, path) {
  const pts = [];
  const ox = (level.cols - 1) / 2;
  const oz = (level.rows - 1) / 2;
  const LEAD = 3.2;

  // lead-in
  {
    const [r, c] = [level.entry.r, level.entry.c];
    const [sx, sz] = SIDE_VEC[level.entry.side];
    const start = [c - ox + sx * 0.5, r - oz + sz * 0.5];
    for (let s = LEAD; s > 0.001; s -= 0.4) pts.push([start[0] + sx * s, start[1] + sz * s]);
  }
  for (let i = 0; i < path.length; i++) {
    const r = Math.floor(path[i] / level.cols);
    const c = path[i] % level.cols;
    const [a, b] = conns[i];
    const bb = b === -1 ? (a + 2) % 4 : b;
    const curve = localCurve(a, bb);
    const n = (a + 2) % 4 === bb ? 2 : 12;
    for (let k = 0; k < n; k++) {
      const [lx, lz] = curve.p(k / n);
      pts.push([c - ox + lx, r - oz + lz]);
    }
  }
  // lead-out
  {
    const [r, c] = [level.exit.r, level.exit.c];
    const [sx, sz] = SIDE_VEC[level.exit.side];
    const start = [c - ox + sx * 0.5, r - oz + sz * 0.5];
    for (let s = 0; s <= LEAD; s += 0.4) pts.push([start[0] + sx * s, start[1] + sz * s]);
  }
  const dist = [0];
  for (let i = 1; i < pts.length; i++) {
    dist.push(dist[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return { pts, dist, total: dist[dist.length - 1] };
}

export function sampleRoute(route, d) {
  const { pts, dist, total } = route;
  const t = Math.min(Math.max(d, 0), total - 1e-4);
  let lo = 0;
  let hi = dist.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (dist[m] <= t) lo = m;
    else hi = m;
  }
  const seg = dist[hi] - dist[lo] || 1;
  const f = (t - dist[lo]) / seg;
  const x = pts[lo][0] + (pts[hi][0] - pts[lo][0]) * f;
  const z = pts[lo][1] + (pts[hi][1] - pts[lo][1]) * f;
  const ang = Math.atan2(pts[hi][1] - pts[lo][1], pts[hi][0] - pts[lo][0]);
  return { x, z, ang };
}
