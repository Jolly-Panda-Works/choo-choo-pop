import { DR, DC } from './logic.js';

/**
 * Counts distinct valid tracks (stops counting at `limit`).
 * level: { rows, cols, entry:{r,c}, exit:{r,c}, rowClues, colClues, given:[idx] }
 */
export function countSolutions(level, limit = 2) {
  const { rows, cols, rowClues, colClues } = level;
  const N = rows * cols;
  const start = level.entry.r * cols + level.entry.c;
  const goal = level.exit.r * cols + level.exit.c;
  const rowCnt = new Array(rows).fill(0);
  const colCnt = new Array(cols).fill(0);
  const rowFree = new Array(rows).fill(cols);
  const colFree = new Array(cols).fill(rows);
  const visited = new Uint8Array(N);
  const givenSet = new Set(level.given);
  let givenLeft = givenSet.size;
  let found = 0;

  const mark = (i, v) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    visited[i] = v ? 1 : 0;
    const d = v ? 1 : -1;
    rowCnt[r] += d;
    colCnt[c] += d;
    rowFree[r] -= d;
    colFree[c] -= d;
    if (givenSet.has(i)) givenLeft -= d;
  };

  const feasible = () => {
    // every line must still be able to reach its clue with unvisited cells
    for (let r = 0; r < rows; r++) {
      if (rowCnt[r] > rowClues[r] || rowClues[r] - rowCnt[r] > rowFree[r]) return false;
    }
    for (let c = 0; c < cols; c++) {
      if (colCnt[c] > colClues[c] || colClues[c] - colCnt[c] > colFree[c]) return false;
    }
    return true;
  };

  const reach = (from) => {
    const seen = new Uint8Array(N);
    const st = [from];
    seen[from] = 1;
    while (st.length) {
      const cur = st.pop();
      if (cur === goal) return true;
      const r = Math.floor(cur / cols);
      const c = cur % cols;
      for (let d = 0; d < 4; d++) {
        const nr = r + DR[d];
        const nc = c + DC[d];
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        const ni = nr * cols + nc;
        if (!seen[ni] && !visited[ni]) {
          seen[ni] = 1;
          st.push(ni);
        }
      }
    }
    return false;
  };

  const dfs = (cur) => {
    if (found >= limit) return;
    if (cur === goal) {
      if (givenLeft !== 0) return;
      for (let r = 0; r < rows; r++) if (rowCnt[r] !== rowClues[r]) return;
      for (let c = 0; c < cols; c++) if (colCnt[c] !== colClues[c]) return;
      found++;
      return;
    }
    const r = Math.floor(cur / cols);
    const c = cur % cols;
    for (let d = 0; d < 4; d++) {
      const nr = r + DR[d];
      const nc = c + DC[d];
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
      const ni = nr * cols + nc;
      if (visited[ni]) continue;
      mark(ni, true);
      if (feasible() && (ni === goal || reach(ni))) dfs(ni);
      mark(ni, false);
      if (found >= limit) return;
    }
  };

  mark(start, true);
  if (feasible()) dfs(start);
  mark(start, false);
  return found;
}
