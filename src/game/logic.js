// Directions / sides: 0 = N, 1 = E, 2 = S, 3 = W
export const DR = [-1, 0, 1, 0];
export const DC = [0, 1, 0, -1];
export const opposite = (d) => (d + 2) % 4;

export const idxOf = (level, r, c) => r * level.cols + c;
export const rcOf = (level, i) => [Math.floor(i / level.cols), i % level.cols];

/** Direction from cell a to adjacent cell b, or -1 if not adjacent. */
export function dirBetween(level, a, b) {
  const [ar, ac] = rcOf(level, a);
  const [br, bc] = rcOf(level, b);
  for (let d = 0; d < 4; d++) if (ar + DR[d] === br && ac + DC[d] === bc) return d;
  return -1;
}

export const initialPath = (level) => [idxOf(level, level.entry.r, level.entry.c)];
/** Where a level begins: usually just the entry tile, sometimes a pre-laid (wrong) rail for the tutorial. */
export const startPath = (level) => (level.preset ? [...level.preset] : initialPath(level));
export const exitIdx = (level) => idxOf(level, level.exit.r, level.exit.c);

/**
 * Move the "finger" onto a cell.
 * - cell already in path  -> path is cut back to that cell
 * - cell next to the head -> path grows (unless the train already reached the exit)
 * Returns the new path (same array if nothing changed).
 */
export function stepOnto(level, path, cell) {
  const head = path[path.length - 1];
  if (cell === head) return path;
  const at = path.indexOf(cell);
  if (at !== -1) return path.slice(0, at + 1);
  if (head === exitIdx(level)) return path;
  if (dirBetween(level, head, cell) === -1) return path;
  return [...path, cell];
}

export function countLines(level, path) {
  const rows = new Array(level.rows).fill(0);
  const cols = new Array(level.cols).fill(0);
  for (const i of path) {
    const [r, c] = rcOf(level, i);
    rows[r]++;
    cols[c]++;
  }
  return { rows, cols };
}

export function evaluate(level, path) {
  const counts = countLines(level, path);
  const reachedExit = path[path.length - 1] === exitIdx(level);
  const rowsOk = counts.rows.every((n, i) => n === level.rowClues[i]);
  const colsOk = counts.cols.every((n, i) => n === level.colClues[i]);
  const givenOk = level.given.every((g) => path.includes(g));
  return {
    counts,
    reachedExit,
    rowsOk,
    colsOk,
    givenOk,
    solved: reachedExit && rowsOk && colsOk && givenOk,
  };
}

/** Next hint: keep the longest correct prefix, then add one correct cell. */
export function applyHint(level, path) {
  const sol = level.solution;
  let k = 0;
  while (k < path.length && k < sol.length && path[k] === sol[k]) k++;
  const base = path.slice(0, k);
  if (k < sol.length) base.push(sol[k]);
  return base;
}

/** Side vector helpers (world: x = east, z = south) */
export const SIDE_VEC = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/** Piece connections for each cell of the path: [sideIn, sideOut] */
export function pathConnections(level, path) {
  const out = [];
  for (let i = 0; i < path.length; i++) {
    const a = i === 0 ? level.entry.side : opposite(dirBetween(level, path[i - 1], path[i]));
    let b;
    if (i < path.length - 1) b = dirBetween(level, path[i], path[i + 1]);
    else if (path[i] === exitIdx(level)) b = level.exit.side;
    else b = -1; // open end (head)
    out.push([a, b]);
  }
  return out;
}
