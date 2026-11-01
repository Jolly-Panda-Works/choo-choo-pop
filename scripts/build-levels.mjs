// Dev tool: builds src/game/levelData.js (Part 1 = 20 levels, every one uniquely solvable).
// Usage: node scripts/build-levels.mjs
//
// STAGE 1 (levels 1-20) is FROZEN: it is copied from the existing levelData.js so saved games stay valid.
// STAGE 2 (21-40): one track, bigger boards, power-ups unlocked.  STAGE 3 (41-60): several tracks (2, then 3 and 4)
// with their own entry / exit gates; some gates sit inside the board on a tree block.
// Levels 1-5  : hand-made 3x3 tutorial (see src/game/tutorial.js for the coaching text)
// Levels 6-20 : generated. Difficulty is measured, not guessed: we count how many search
//               nodes the solver needs (more nodes = more dead ends a child can walk into)
//               and each slot only accepts a puzzle inside its own band, so the curve
//               can only go up.
import { writeFileSync } from 'node:fs';
import { mulberry32, shuffle } from '../src/game/rng.js';
import { generateCandidate, generateMulti } from '../src/game/generator.js';
import { hydrateLevel } from '../src/game/levels.js';
import { LEVEL_DATA as OLD } from '../src/game/levelData.js';
import { solveStats } from '../src/game/solver.js';

// difficulty: 0 tutorial, 1 easy, 2 medium, 3 hard, 4 super hard (stage 1 has only the very last level like this)
// sides: 0 N, 1 E, 2 S, 3 W   entry/exit = [row, col, side]   cells are row*3+col
const TUTORIAL = [
  // 1. just drag from the green arrow to the red arrow (straight line)
  { rows: 3, cols: 3, entry: [1, 0, 3], exit: [1, 2, 1], solution: [3, 4, 5], given: [] },
  // 2. rails can turn
  { rows: 3, cols: 3, entry: [0, 0, 3], exit: [2, 2, 2], solution: [0, 1, 2, 5, 8], given: [] },
  // 3. the numbers decide the way (a short cut would break the numbers)
  { rows: 3, cols: 3, entry: [0, 0, 3], exit: [2, 0, 3], solution: [0, 1, 2, 5, 8, 7, 6], given: [] },
  // 4. mistakes are fine: the level starts with a wrong rail that the child erases
  { rows: 3, cols: 3, entry: [0, 0, 3], exit: [0, 2, 1], solution: [0, 3, 4, 5, 2], given: [], preset: [0, 1] },
  // 5. star tile: without the star there would be two answers
  { rows: 3, cols: 3, entry: [0, 1, 0], exit: [2, 1, 2], solution: [1, 2, 5, 4, 3, 6, 7], given: [2] },
];

// [rows, cols, fillRatio, givens (helper stars), minNodes, maxNodes, difficulty]
const PLAN = [
  // easy
  [3, 4, 0.6, 0, 1, 25, 1],
  [4, 4, 0.55, 0, 18, 35, 1],
  [4, 4, 0.6, 0, 36, 60, 1],
  [4, 4, 0.6, 1, 50, 90, 1],
  [4, 5, 0.6, 1, 60, 110, 1],
  // medium
  [4, 5, 0.62, 1, 110, 180, 2],
  [5, 5, 0.58, 1, 140, 250, 2],
  [5, 5, 0.6, 2, 250, 400, 2],
  [5, 5, 0.62, 2, 400, 600, 2],
  [5, 5, 0.64, 2, 600, 900, 2],
  // hard (still kid-sized: biggest board is 6x6 and it carries gold stars as anchors)
  [5, 6, 0.6, 2, 400, 800, 3],
  [5, 6, 0.62, 2, 800, 1400, 3],
  [5, 6, 0.64, 3, 1400, 2200, 3],
  [6, 6, 0.6, 3, 1300, 2500, 3],
  // super hard: level 20 (the stage boss). Same 6x6 board but far more dead ends and only 2 helper stars.
  [6, 6, 0.66, 2, 9000, 80000, 4],
];

function hydrate(c, given) {
  const rowClues = new Array(c.rows).fill(0);
  const colClues = new Array(c.cols).fill(0);
  for (const i of c.solution) {
    rowClues[Math.floor(i / c.cols)]++;
    colClues[i % c.cols]++;
  }
  return {
    rows: c.rows,
    cols: c.cols,
    entry: { r: c.entry[0], c: c.entry[1], side: c.entry[2] },
    exit: { r: c.exit[0], c: c.exit[1], side: c.exit[2] },
    rowClues,
    colClues,
    given,
  };
}

const out = OLD.slice(0, 20).map((d) => ({ ...d }));
console.log('stage 1: kept', out.length, 'levels');

// [rows, cols, ratio, maxGivenStars, minNodes, maxNodes, difficulty]
const STAGE2 = [
  [5, 5, 0.6, 0, 60, 300, 1],
  [5, 5, 0.62, 0, 150, 450, 1],
  [5, 5, 0.62, 1, 100, 400, 1],
  [5, 5, 0.64, 1, 200, 600, 1],
  [5, 6, 0.6, 1, 150, 600, 1],
  [5, 6, 0.62, 1, 300, 900, 2],
  [5, 6, 0.62, 2, 300, 1000, 2],
  [5, 6, 0.64, 2, 500, 1300, 2],
  [6, 6, 0.58, 2, 400, 1300, 2],
  [6, 6, 0.6, 2, 700, 1800, 2],
  [6, 6, 0.6, 3, 800, 2000, 2],
  [6, 6, 0.62, 3, 1200, 2600, 3],
  [6, 6, 0.62, 3, 1800, 3400, 3],
  [6, 6, 0.64, 3, 2400, 4600, 3],
  [6, 6, 0.64, 3, 3200, 6000, 3],
  [6, 7, 0.6, 3, 2500, 6500, 3],
  [6, 7, 0.62, 3, 3500, 8000, 3],
  [6, 7, 0.62, 3, 5000, 12000, 3],
  // super hard: the last two levels of the stage
  [6, 7, 0.64, 2, 14000, 50000, 4],
  [6, 7, 0.66, 2, 30000, 110000, 4],
];
// [rows, cols, lanes, ratio, interiorGateChance, minNodes, maxNodes, difficulty]
const STAGE3 = [
  // levels 1-10: two tracks
  [5, 5, 2, 0.6, 0.0, 20, 90, 1],
  [5, 5, 2, 0.62, 0.0, 40, 140, 1],
  [5, 5, 2, 0.62, 0.3, 60, 200, 1],
  [5, 5, 2, 0.64, 0.5, 90, 300, 1],
  [5, 5, 2, 0.66, 0.5, 120, 420, 1],
  [5, 6, 2, 0.6, 0.5, 150, 600, 2],
  [5, 6, 2, 0.62, 0.5, 250, 900, 2],
  [6, 6, 2, 0.58, 0.5, 300, 1200, 2],
  [6, 6, 2, 0.6, 0.5, 500, 1800, 2],
  [6, 6, 2, 0.62, 0.5, 800, 2600, 2],
  // levels 11-18: three tracks
  [5, 6, 3, 0.62, 0.4, 100, 500, 2],
  [6, 6, 3, 0.58, 0.4, 150, 700, 2],
  [6, 6, 3, 0.6, 0.5, 250, 1000, 3],
  [6, 6, 3, 0.62, 0.5, 400, 1500, 3],
  [6, 6, 3, 0.64, 0.5, 600, 2200, 3],
  [6, 7, 3, 0.6, 0.5, 600, 2500, 3],
  [6, 7, 3, 0.62, 0.5, 900, 3500, 3],
  [6, 7, 4, 0.58, 0.5, 700, 3500, 3],
  // super hard: the last two levels
  [6, 7, 3, 0.64, 0.5, 4000, 30000, 4],
  [7, 7, 4, 0.58, 0.5, 5000, 60000, 4],
];

const withGivens = (cand, rng, maxGiven, cap) => {
  const all = cand.lanes.flatMap((l) => l.solution);
  const ends = new Set(cand.lanes.flatMap((l) => [l.solution[0], l.solution[l.solution.length - 1]]));
  const pool = all.filter((x) => !ends.has(x));
  let given = [];
  for (;;) {
    const st = solveStats(hydrateLevel({ ...cand, given, difficulty: 1 }), 2, cap);
    if (st.capped) return null;
    if (st.found === 1) return { given, st };
    if (given.length >= maxGiven) return null;
    given = [...given, pool.splice(Math.floor(rng() * pool.length), 1)[0]];
  }
};

function build(stage, slot, make, lo, hi, diff, maxGiven) {
  const rng = mulberry32(9000 + stage * 100003 + slot * 131);
  const num = (stage - 1) * 20 + slot + 1;
  for (let tries = 0; tries < 40000; tries++) {
    const cand = make(rng);
    if (!cand) continue;
    const r = withGivens(cand, rng, maxGiven, hi * 2 + 1000);
    if (!r || r.st.nodes < lo || r.st.nodes > hi) continue;
    const lanes = cand.lanes;
    const entry = {
      rows: cand.rows,
      cols: cand.cols,
      ...(lanes.length === 1 && !cand.blocks.length
        ? { entry: lanes[0].entry, exit: lanes[0].exit, solution: lanes[0].solution }
        : { lanes, blocks: cand.blocks }),
      given: r.given,
      difficulty: diff,
      nodes: r.st.nodes,
    };
    out.push(entry);
    console.log(`level ${num}: ${cand.rows}x${cand.cols} lanes=${lanes.length} blocks=${cand.blocks.length} stars=${r.given.length} nodes=${r.st.nodes} (try ${tries})`);
    return;
  }
  throw new Error('no level found for ' + num);
}

STAGE2.forEach(([rows, cols, ratio, nGiven, lo, hi, diff], slot) =>
  build(2, slot, (rng) => {
    const c = generateCandidate(rows, cols, ratio, rng);
    return { rows, cols, lanes: [{ entry: c.entry, exit: c.exit, solution: c.solution }], blocks: [] };
  }, lo, hi, diff, nGiven),
);
STAGE3.forEach(([rows, cols, K, ratio, inter, lo, hi, diff], slot) =>
  build(3, slot, (rng) => generateMulti(rows, cols, K, ratio, rng, inter), lo, hi, diff, 3),
);

writeFileSync(
  new URL('../src/game/levelData.js', import.meta.url),
  '// Generated by scripts/build-levels.mjs — every level has exactly one solution.\nexport const LEVEL_DATA = ' +
    JSON.stringify(out) +
    ';\n',
);
console.log('written', out.length, 'levels');
