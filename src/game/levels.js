import { LEVEL_DATA } from './levelData.js';

export const levelCount = LEVEL_DATA.length;
export const DIFFICULTY_KEYS = ['easy', 'medium', 'hard', 'expert'];

const cache = new Map();

/** n is 1-based. Levels are pre-built (see scripts/build-levels.mjs) and each has exactly one solution. */
export function getLevel(n) {
  if (cache.has(n)) return cache.get(n);
  const d = LEVEL_DATA[n - 1];
  const rowClues = new Array(d.rows).fill(0);
  const colClues = new Array(d.cols).fill(0);
  for (const i of d.solution) {
    rowClues[Math.floor(i / d.cols)]++;
    colClues[i % d.cols]++;
  }
  const level = {
    id: n,
    rows: d.rows,
    cols: d.cols,
    difficulty: d.difficulty,
    entry: { r: d.entry[0], c: d.entry[1], side: d.entry[2] },
    exit: { r: d.exit[0], c: d.exit[1], side: d.exit[2] },
    solution: d.solution,
    given: d.given,
    rowClues,
    colClues,
  };
  cache.set(n, level);
  return level;
}
