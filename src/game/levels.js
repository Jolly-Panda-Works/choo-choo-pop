import { LEVEL_DATA } from './levelData.js';

/** Number of levels that are really built (stage 1 = 20 for now). */
export const levelCount = LEVEL_DATA.length;
// 0 = guided tutorial (levels 1-5), then easy / medium / hard, 4 = super hard (stage boss)
export const DIFFICULTY_KEYS = ['tutorial', 'easy', 'medium', 'hard', 'superHard'];
/** Visual family of the difficulty on the map: the tutorial looks like "easy". */
export const nodeKind = (difficulty) => ['easy', 'easy', 'normal', 'hard', 'super'][difficulty] || 'easy';

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
    preset: d.preset || null, // tutorial level 4 starts with a wrong rail on purpose
    nodes: d.nodes,
    rowClues,
    colClues,
  };
  cache.set(n, level);
  return level;
}

/** Difficulty of a level without building it (used by the map). */
export const difficultyOf = (n) => LEVEL_DATA[n - 1]?.difficulty ?? 1;
