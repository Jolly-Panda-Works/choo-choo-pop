import { mulberry32, shuffle } from './rng.js';
import { DR, DC } from './logic.js';

function borderCells(rows, cols) {
  const list = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) if (r === 0 || c === 0 || r === rows - 1 || c === cols - 1) list.push([r, c]);
  return list;
}

function outerSides(rows, cols, r, c) {
  const s = [];
  if (r === 0) s.push(0);
  if (c === cols - 1) s.push(1);
  if (r === rows - 1) s.push(2);
  if (c === 0) s.push(3);
  return s;
}

function neighbors(rows, cols, i) {
  const r = Math.floor(i / cols);
  const c = i % cols;
  const out = [];
  for (let d = 0; d < 4; d++) {
    const nr = r + DR[d];
    const nc = c + DC[d];
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push(nr * cols + nc);
  }
  return out;
}

function reachable(rows, cols, from, goal, visited) {
  const seen = new Uint8Array(rows * cols);
  const stack = [from];
  seen[from] = 1;
  while (stack.length) {
    const cur = stack.pop();
    if (cur === goal) return true;
    for (const nb of neighbors(rows, cols, cur)) {
      if (!seen[nb] && (!visited[nb] || nb === goal)) {
        seen[nb] = 1;
        stack.push(nb);
      }
    }
  }
  return false;
}

/** Randomised DFS: simple path start -> goal with at least minLen cells. */
function findPath(rows, cols, start, goal, minLen, rng, cap) {
  const visited = new Uint8Array(rows * cols);
  const path = [start];
  visited[start] = 1;
  const stack = [shuffle(neighbors(rows, cols, start), rng)];
  let steps = 0;
  while (path.length) {
    if (++steps > cap) return null;
    const head = path[path.length - 1];
    if (head === goal) return path;
    const opts = stack[stack.length - 1];
    let advanced = false;
    while (opts.length) {
      const nb = opts.pop();
      if (visited[nb]) continue;
      if (nb === goal && path.length + 1 < minLen) continue;
      path.push(nb);
      visited[nb] = 1;
      if (nb !== goal && !reachable(rows, cols, nb, goal, visited)) {
        path.pop();
        visited[nb] = 0;
        continue;
      }
      stack.push(shuffle(neighbors(rows, cols, nb), rng));
      advanced = true;
      break;
    }
    if (!advanced) {
      visited[head] = 0;
      path.pop();
      stack.pop();
    }
  }
  return null;
}

/** Random candidate (no givens yet). Returns { rows, cols, entry, exit, solution }. */
export function generateCandidate(rows, cols, ratio, rng) {
  const border = borderCells(rows, cols);
  const total = rows * cols;
  for (let round = 0; round < 12; round++) {
    const minLen = Math.max(rows + cols - 1, Math.ceil(total * ratio));
    for (let attempt = 0; attempt < 60; attempt++) {
      const e = border[Math.floor(rng() * border.length)];
      const x = border[Math.floor(rng() * border.length)];
      const dist = Math.abs(e[0] - x[0]) + Math.abs(e[1] - x[1]);
      if (dist < Math.max(2, Math.floor((rows + cols) / 2) - 1)) continue;
      const start = e[0] * cols + e[1];
      const goal = x[0] * cols + x[1];
      const path = findPath(rows, cols, start, goal, minLen, rng, 4000);
      if (!path) continue;
      const eS = outerSides(rows, cols, e[0], e[1]);
      const xS = outerSides(rows, cols, x[0], x[1]);
      return {
        rows,
        cols,
        entry: [e[0], e[1], eS[Math.floor(rng() * eS.length)]],
        exit: [x[0], x[1], xS[Math.floor(rng() * xS.length)]],
        solution: path,
      };
    }
    ratio -= 0.04;
  }
  throw new Error('generation failed');
}


function findPathAvoid(rows, cols, start, goal, minLen, rng, cap, used) {
  const visited = Uint8Array.from(used);
  const path = [start];
  visited[start] = 1;
  const stack = [shuffle(neighbors(rows, cols, start), rng)];
  let steps = 0;
  while (path.length) {
    if (++steps > cap) return null;
    const head = path[path.length - 1];
    if (head === goal) return path;
    const opts = stack[stack.length - 1];
    let advanced = false;
    while (opts.length) {
      const nb = opts.pop();
      if (visited[nb]) continue;
      if (nb === goal && path.length + 1 < minLen) continue;
      path.push(nb);
      visited[nb] = 1;
      if (nb !== goal && !reachable(rows, cols, nb, goal, visited)) {
        path.pop();
        visited[nb] = 0;
        continue;
      }
      stack.push(shuffle(neighbors(rows, cols, nb), rng));
      advanced = true;
      break;
    }
    if (!advanced) {
      visited[head] = 0;
      path.pop();
      stack.pop();
    }
  }
  return null;
}

/**
 * Random multi-track candidate: K disjoint tracks, each with its own entry and exit gate.
 * A gate sits outside the board edge, or (probability `interior`) on a "block" cell inside the board next to the track end.
 * Returns { rows, cols, lanes:[{entry:[r,c,side], exit:[r,c,side], solution}], blocks:[cells] } or null.
 */
export function generateMulti(rows, cols, K, ratio, rng, interior = 0.35) {
  const N = rows * cols;
  for (let attempt = 0; attempt < 80; attempt++) {
    const used = new Uint8Array(N);
    const paths = [];
    const perLane = Math.max(3, Math.floor((N * ratio) / K) - 1);
    let ok = true;
    for (let k = 0; k < K && ok; k++) {
      ok = false;
      for (let t = 0; t < 40; t++) {
        const free = [];
        for (let i = 0; i < N; i++) if (!used[i]) free.push(i);
        const s = free[Math.floor(rng() * free.length)];
        const g = free[Math.floor(rng() * free.length)];
        if (s === g) continue;
        const dist = Math.abs(Math.floor(s / cols) - Math.floor(g / cols)) + Math.abs((s % cols) - (g % cols));
        if (dist < 2) continue;
        const path = findPathAvoid(rows, cols, s, g, perLane, rng, 3000, used);
        if (!path) continue;
        for (const c of path) used[c] = 1;
        paths.push(path);
        ok = true;
        break;
      }
    }
    if (!ok) continue;
    // gates
    const blocks = [];
    const gateFor = (cell) => {
      const r = Math.floor(cell / cols);
      const c = cell % cols;
      const outer = outerSides(rows, cols, r, c);
      const inner = [];
      for (let d = 0; d < 4; d++) {
        const nr = r + DR[d];
        const nc = c + DC[d];
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        if (!used[nr * cols + nc]) inner.push(d);
      }
      const useInner = inner.length && (!outer.length || rng() < interior);
      if (useInner) {
        const d = inner[Math.floor(rng() * inner.length)];
        const b = (r + DR[d]) * cols + (c + DC[d]);
        used[b] = 1;
        blocks.push(b);
        return [r, c, d];
      }
      if (outer.length) return [r, c, outer[Math.floor(rng() * outer.length)]];
      return null;
    };
    const lanes = [];
    for (const p of paths) {
      const entry = gateFor(p[0]);
      const exit = entry && gateFor(p[p.length - 1]);
      if (!entry || !exit) {
        ok = false;
        break;
      }
      lanes.push({ entry, exit, solution: p });
    }
    if (!ok) continue;
    return { rows, cols, lanes, blocks: blocks.sort((a, b) => a - b) };
  }
  return null;
}
