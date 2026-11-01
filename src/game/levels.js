import { LEVEL_DATA } from './levelData.js';

/** Number of levels that are really built. */
export const levelCount = LEVEL_DATA.length;
// 0 = guided tutorial (levels 1-5), then easy / medium / hard, 4 = super hard (stage boss)
export const DIFFICULTY_KEYS = ['tutorial', 'easy', 'medium', 'hard', 'superHard'];
/** Visual family of the difficulty on the map: the tutorial looks like "easy". */
export const nodeKind = (difficulty) => ['easy', 'easy', 'normal', 'hard', 'super'][difficulty] || 'easy';

const cache = new Map();
const gate = (a) => ({ r: a[0], c: a[1], side: a[2] });

/**
 * Raw level data -> level object. Old single-track data ({entry, exit, solution}) becomes one lane.
 * Multi-track data: {lanes:[{entry:[r,c,side], exit:[r,c,side], solution:[cells]}], blocks:[cells]}.
 * n is 1-based. Levels are pre-built (scripts/build-levels.mjs) and each has exactly one solution.
 */
export function hydrateLevel(d, id = 0) {
  const rawLanes = d.lanes || [{ entry: d.entry, exit: d.exit, solution: d.solution }];
  const lanes = rawLanes.map((l) => ({ entry: gate(l.entry), exit: gate(l.exit), solution: l.solution }));
  const rowClues = new Array(d.rows).fill(0);
  const colClues = new Array(d.cols).fill(0);
  for (const l of lanes)
    for (const i of l.solution) {
      rowClues[Math.floor(i / d.cols)]++;
      colClues[i % d.cols]++;
    }
  const blocks = d.blocks || [];
  return {
    id,
    rows: d.rows,
    cols: d.cols,
    difficulty: d.difficulty,
    lanes,
    entry: lanes[0].entry,
    exit: lanes[0].exit,
    solution: lanes[0].solution,
    allSolution: lanes.flatMap((l) => l.solution),
    blocks,
    blockSet: new Set(blocks),
    given: d.given || [],
    preset: d.preset || null, // tutorial level 4 starts with a wrong rail on purpose
    nodes: d.nodes,
    rowClues,
    colClues,
  };
}

export function getLevel(n) {
  if (cache.has(n)) return cache.get(n);
  const level = hydrateLevel(LEVEL_DATA[n - 1], n);
  cache.set(n, level);
  return level;
}

/** Difficulty of a level without building it (used by the map). */
export const difficultyOf = (n) => LEVEL_DATA[n - 1]?.difficulty ?? 1;
