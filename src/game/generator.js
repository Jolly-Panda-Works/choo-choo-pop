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
