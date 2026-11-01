import { DR, DC } from './logic.js';

/**
 * Counts distinct valid solutions (stops counting at `limit`) and how many search
 * nodes that took - the node count is our difficulty yardstick when building levels
 * (more nodes = more dead ends a player could wander into).
 * level: { rows, cols, lanes:[{entry:{r,c}, exit:{r,c}}], blocks:[idx], rowClues, colClues, given:[idx] }
 * (a level with plain `entry` / `exit` is one lane). The lanes are tracks that must not touch each other.
 * `nodeCap` aborts a runaway search (result.capped = true).
 */
export function solveStats(level, limit = 2, nodeCap = Infinity) {
  const { rows, cols, rowClues, colClues } = level;
  const lanes = level.lanes || [{ entry: level.entry, exit: level.exit }];
  const K = lanes.length;
  const N = rows * cols;
  const entries = lanes.map((l) => l.entry.r * cols + l.entry.c);
  const exits = lanes.map((l) => l.exit.r * cols + l.exit.c);
  const exitLane = new Int8Array(N).fill(-1);
  exits.forEach((e, i) => (exitLane[e] = i));
  const isBlock = new Uint8Array(N);
  for (const b of level.blocks || []) isBlock[b] = 1;
  const rowCnt = new Array(rows).fill(0);
  const colCnt = new Array(cols).fill(0);
  const rowFree = new Array(rows).fill(cols);
  const colFree = new Array(cols).fill(rows);
  const visited = new Uint8Array(N);
  const givenSet = new Set(level.given);
  let givenLeft = givenSet.size;
  let found = 0;
  let nodes = 0;
  let capped = false;

  for (let i = 0; i < N; i++)
    if (isBlock[i]) {
      visited[i] = 1;
      rowFree[Math.floor(i / cols)]--;
      colFree[i % cols]--;
    }
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
    for (let r = 0; r < rows; r++) {
      if (rowCnt[r] > rowClues[r] || rowClues[r] - rowCnt[r] > rowFree[r]) return false;
    }
    for (let c = 0; c < cols; c++) {
      if (colCnt[c] > colClues[c] || colClues[c] - colCnt[c] > colFree[c]) return false;
    }
    return true;
  };

  const seenAll = new Uint8Array(N);
  const stack = [];
  // can lane `li` get from `from` to its exit, can every later lane get from its entry to its exit,
  // and can every star tile that is not on a track yet still be reached by one of them?
  const reachOk = (li, head) => {
    seenAll.fill(0);
    for (let lj = li; lj < K; lj++) {
      const from = lj === li ? head : entries[lj];
      if (lj === li && from === exits[li]) continue;
      const seen = new Uint8Array(N);
      seen[from] = 1;
      stack.length = 0;
      stack.push(from);
      while (stack.length) {
        const cur = stack.pop();
        seenAll[cur] = 1;
        const r = Math.floor(cur / cols);
        const c = cur % cols;
        for (let d = 0; d < 4; d++) {
          const nr = r + DR[d];
          const nc = c + DC[d];
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
          const ni = nr * cols + nc;
          if (seen[ni] || visited[ni]) continue;
          if (exitLane[ni] !== -1 && exitLane[ni] !== lj) continue;
          seen[ni] = 1;
          stack.push(ni);
        }
      }
      if (!seen[exits[lj]]) return false;
    }
    for (const g of givenSet) if (!visited[g] && !seenAll[g]) return false;
    return true;
  };

  const dfs = (li, cur) => {
    if (++nodes > nodeCap) {
      capped = true;
      return;
    }
    if (found >= limit) return;
    if (cur === exits[li]) {
      if (li === K - 1) {
        if (givenLeft !== 0) return;
        for (let r = 0; r < rows; r++) if (rowCnt[r] !== rowClues[r]) return;
        for (let c = 0; c < cols; c++) if (colCnt[c] !== colClues[c]) return;
        found++;
        return;
      }
      if (feasible() && reachOk(li + 1, entries[li + 1])) dfs(li + 1, entries[li + 1]);
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
      if (exitLane[ni] !== -1 && exitLane[ni] !== li) continue;
      mark(ni, true);
      if (feasible() && reachOk(li, ni)) dfs(li, ni);
      mark(ni, false);
      if (found >= limit || capped) return;
    }
  };

  for (const e of entries) mark(e, true);
  if (feasible() && reachOk(0, entries[0])) dfs(0, entries[0]);
  return { found, nodes, capped };
}

export const countSolutions = (level, limit = 2) => solveStats(level, limit).found;
