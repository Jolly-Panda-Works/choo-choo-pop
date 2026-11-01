// Directions / sides: 0 = N, 1 = E, 2 = S, 3 = W
// A level has 1..4 "lanes". Lane i is one track that must run from its own entry gate to its own exit gate.
// Tracks never touch each other. Gates sit just outside the board edge, OR on a tree-covered "block" cell inside the board.
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

export const laneEntryIdx = (level, lane) => idxOf(level, level.lanes[lane].entry.r, level.lanes[lane].entry.c);
export const laneExitIdx = (level, lane) => idxOf(level, level.lanes[lane].exit.r, level.lanes[lane].exit.c);
export const initialPaths = (level) => level.lanes.map((_, i) => [laneEntryIdx(level, i)]);
/** Where a level begins: the entry tiles, sometimes a pre-laid (wrong) rail for the tutorial. */
export const startPaths = (level) => {
  const p = initialPaths(level);
  if (level.preset) p[0] = [...level.preset];
  return p;
};
export const allCells = (paths) => paths.flat();

/** Lane that finger-down on `cell` should drive: one that already owns the cell, else one whose open head touches it. */
export function laneForCell(level, paths, cell) {
  for (let i = 0; i < paths.length; i++) if (paths[i].includes(cell)) return i;
  for (let i = 0; i < paths.length; i++) {
    const head = paths[i][paths[i].length - 1];
    if (head !== laneExitIdx(level, i) && dirBetween(level, head, cell) !== -1 && canEnter(level, paths, i, cell)) return i;
  }
  return -1;
}

function canEnter(level, paths, lane, cell) {
  if (level.blockSet.has(cell)) return false;
  for (let j = 0; j < paths.length; j++) {
    if (j !== lane && paths[j].includes(cell)) return false;
    if (j !== lane && cell === laneExitIdx(level, j)) return false; // someone else's exit tunnel
  }
  return true;
}

/**
 * Move lane `lane`'s "finger" onto a cell.
 * - cell already in that lane's path -> path is cut back to that cell
 * - cell next to the head            -> path grows (unless this lane already reached its exit)
 * Returns the new paths array (same array if nothing changed).
 */
export function stepOnto(level, paths, lane, cell) {
  const path = paths[lane];
  const head = path[path.length - 1];
  if (cell === head) return paths;
  const set = (np) => paths.map((p, i) => (i === lane ? np : p));
  const at = path.indexOf(cell);
  if (at !== -1) return set(path.slice(0, at + 1));
  if (head === laneExitIdx(level, lane)) return paths;
  if (dirBetween(level, head, cell) === -1) return paths;
  if (!canEnter(level, paths, lane, cell)) return paths;
  return set([...path, cell]);
}

export function countLines(level, paths) {
  const rows = new Array(level.rows).fill(0);
  const cols = new Array(level.cols).fill(0);
  for (const i of allCells(paths)) {
    const [r, c] = rcOf(level, i);
    rows[r]++;
    cols[c]++;
  }
  return { rows, cols };
}

export function evaluate(level, paths) {
  const counts = countLines(level, paths);
  const laneDone = paths.map((p, i) => p[p.length - 1] === laneExitIdx(level, i));
  const reachedExit = laneDone.every(Boolean);
  const rowsOk = counts.rows.every((n, i) => n === level.rowClues[i]);
  const colsOk = counts.cols.every((n, i) => n === level.colClues[i]);
  const cells = new Set(allCells(paths));
  const givenOk = level.given.every((g) => cells.has(g));
  return { counts, laneDone, reachedExit, rowsOk, colsOk, givenOk, solved: reachedExit && rowsOk && colsOk && givenOk };
}

/** Longest correct prefix of one lane. */
export function goodPrefix(level, paths, lane) {
  const sol = level.lanes[lane].solution;
  const p = paths[lane];
  let k = 0;
  while (k < p.length && k < sol.length && p[k] === sol[k]) k++;
  return k;
}

/** Next hint: first lane that is not finished -> keep its longest correct prefix, then add one correct cell. */
export function applyHint(level, paths) {
  for (let lane = 0; lane < paths.length; lane++) {
    const sol = level.lanes[lane].solution;
    const k = goodPrefix(level, paths, lane);
    if (k >= sol.length && paths[lane].length === sol.length) continue;
    const base = paths[lane].slice(0, k);
    if (k < sol.length) base.push(sol[k]);
    // wrong rails of OTHER lanes sitting on the new cell are removed too
    return paths.map((p, i) => {
      if (i === lane) return base;
      const cut = p.findIndex((c) => c === sol[k]);
      return cut > 0 ? p.slice(0, cut) : p;
    });
  }
  return paths;
}

/** Power-up "eraser": every lane keeps only its correct rails. */
export function eraseWrong(level, paths) {
  return paths.map((p, i) => p.slice(0, Math.max(1, goodPrefix(level, paths, i))));
}

/** Side vector helpers (world: x = east, z = south) */
export const SIDE_VEC = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/** Piece connections for each cell of one lane's path: [sideIn, sideOut] */
export function pathConnections(level, path, lane = 0) {
  const L = level.lanes[lane];
  const exit = laneExitIdx(level, lane);
  const out = [];
  for (let i = 0; i < path.length; i++) {
    const a = i === 0 ? L.entry.side : opposite(dirBetween(level, path[i - 1], path[i]));
    let b;
    if (i < path.length - 1) b = dirBetween(level, path[i], path[i + 1]);
    else if (path[i] === exit) b = L.exit.side;
    else b = -1; // open end (head)
    out.push([a, b]);
  }
  return out;
}

/** Is the gate of this lane outside the board (true) or on a tree block inside it (false)? */
export const gateIsOuter = (level, g) => {
  const nr = g.r + DR[g.side];
  const nc = g.c + DC[g.side];
  return nr < 0 || nc < 0 || nr >= level.rows || nc >= level.cols;
};
