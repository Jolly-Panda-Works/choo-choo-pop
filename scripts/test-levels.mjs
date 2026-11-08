import { LEVEL_DATA } from '../src/game/levelData.js';
import { puzzleKey } from './puzzle-key.mjs';
import { getLevel, levelCount } from '../src/game/levels.js';
import { evaluate, stepOnto, startPaths, initialPaths, applyHint, eraseWrong, laneForCell, gateIsOuter, laneEntryIdx, laneExitIdx } from '../src/game/logic.js';
import { solveStats } from '../src/game/solver.js';
import { analyzePath, coachFor } from '../src/game/tutorial.js';
import { STAGE_SIZE, TUTORIAL_LEVELS, POWERUP_TEACH, powerAvailable } from '../src/game/constants.js';

const fail = (m) => {
  throw new Error(m);
};
if (levelCount % STAGE_SIZE !== 0) fail(`levelData has ${levelCount} levels; it must be a whole number of stages (${STAGE_SIZE} each)`);

let prev = null;
for (let n = 1; n <= levelCount; n++) {
  const lv = getLevel(n);
  const stage = Math.ceil(n / STAGE_SIZE);
  const K = lv.lanes.length;

  const inStage = ((n - 1) % STAGE_SIZE) + 1;
  if (stage <= 3 && (K !== 1 || lv.rows !== 3 || lv.cols !== (stage === 1 ? 3 : 4) || lv.difficulty > 1)) fail('First three lands must stay very easy');
  if (n > 5 && n <= 60 && lv.allSolution.length > 6) fail('Beginner path too long');
  if (stage === 4 && K !== 1) fail('Land 4 introduces powers with one train');
  if (stage === 5 && K !== 2) fail('Land 5 needs two trains');
  if (stage === 6 && K !== (inStage <= 10 ? 2 : 3)) fail('Land 6 train progression');

  // --- the stored solution is accepted
  let paths = initialPaths(lv);
  lv.lanes.forEach((l, i) => {
    for (const cell of l.solution.slice(1)) paths = stepOnto(lv, paths, i, cell);
  });
  if (!evaluate(lv, paths).solved) fail('Level ' + n + ': solution rejected');
  // --- hints finish it
  let hp = startPaths(lv);
  for (let i = 0; i < lv.allSolution.length + 4; i++) hp = applyHint(lv, hp);
  if (!evaluate(lv, hp).solved) fail('Level ' + n + ': hints do not solve it');
  // --- eraser keeps only correct rails
  const wrong = startPaths(lv).map((p, i) => [...p]);
  if (eraseWrong(lv, wrong).some((p, i) => p[0] !== laneEntryIdx(lv, i))) fail('Level ' + n + ': eraser broke an entry');
  // --- gates: entries/exits are distinct path ends; inside gates have a free tree block next to the cell
  const ends = new Set();
  lv.lanes.forEach((l, i) => {
    for (const g of [l.entry, l.exit]) {
      const cell = g.r * lv.cols + g.c;
      if (ends.has(cell)) fail(`Level ${n}: two gates share a cell`);
      ends.add(cell);
      if (!gateIsOuter(lv, g)) {
        const b = (g.r + [-1, 0, 1, 0][g.side]) * lv.cols + g.c + [0, 1, 0, -1][g.side];
        if (!lv.blockSet.has(b)) fail(`Level ${n}: inside gate without a block`);
      }
    }
    if (l.solution[0] !== laneEntryIdx(lv, i) || l.solution[l.solution.length - 1] !== laneExitIdx(lv, i)) fail(`Level ${n}: lane ${i} ends do not match its gates`);
  });
  for (const b of lv.blocks) if (lv.allSolution.includes(b)) fail(`Level ${n}: a block lies on a track`);
  if (new Set(lv.allSolution).size !== lv.allSolution.length) fail(`Level ${n}: tracks touch each other`);
  const st = solveStats(lv, 2);
  if (st.found !== 1) fail(`Level ${n}: ${st.found} solutions (expected exactly 1)`);

  // --- tutorial rules: 3x3 and a coach message at every stage
  if (n <= TUTORIAL_LEVELS) {
    if (lv.rows !== 3 || lv.cols !== 3) fail(`Level ${n}: tutorial levels must be 3x3`);
    if (lv.difficulty !== 0) fail(`Level ${n}: tutorial levels must have difficulty 0`);
    if (!coachFor(lv, startPaths(lv)[0], false)?.text) fail(`Level ${n}: no coach text at start`);
    const wrongPath = lv.preset || null;
    if (n === 4 && (!wrongPath || analyzePath(lv, wrongPath).wrong === 0)) fail('Level 4 must start with a wrong rail');
    if (n === 5 && lv.given.length === 0) fail('Level 5 must teach the star tile');
    if (n === 5 && solveStats({ ...lv, given: [] }, 2).found < 2) fail('Level 5: the star must be what makes the answer unique');
  } else {
    if (lv.difficulty === 0) fail(`Level ${n}: only levels 1-${TUTORIAL_LEVELS} may be tutorial`);
    const area = lv.rows * lv.cols;
    const same = prev && prev.stage === stage && prev.K === K;
    if (same && area < prev.area) fail(`Level ${n}: board got smaller than level ${n - 1}`);
    if (same && lv.difficulty < prev.difficulty) fail(`Level ${n}: difficulty label went down`);
    if (lv.rows > 7 || lv.cols > 7) fail(`Level ${n}: bigger than 7x7`);
  }
  prev = { stage, K, area: lv.rows * lv.cols, difficulty: lv.difficulty, nodes: st.nodes };
  const label = ['tutorial', 'easy', 'medium', 'hard', 'SUPER'][lv.difficulty];
  console.log(
    `level ${String(n).padStart(2)}: ${lv.rows}x${lv.cols} ${label.padEnd(8)} tracks ${K}, ${String(lv.allSolution.length).padStart(2)} rails, ${lv.blocks.length} blocks, ${lv.given.length} star tiles, nodes ${String(st.nodes).padStart(5)} - unique OK`,
  );
}
console.log(`\nall ${levelCount} levels OK`);

if (levelCount !== 120) fail('Campaign must reach Clover Peak: 120 levels');
for (const [id, introduction] of Object.entries(POWERUP_TEACH)) {
  if (powerAvailable(id, introduction - 1, { [id]: true })) fail('Power unlocked early: ' + id);
  if (!powerAvailable(id, introduction, { [id]: true })) fail('Power not unlocked: ' + id);
  if (powerAvailable(id, introduction, {})) fail('Power needs its lesson: ' + id);
  if (powerAvailable(id, 1, { [id]: true })) fail('Saved lesson enabled power in beginner land');
}

// Peek follows the correct prefix, never mutates rails, and previews only one lane.
const { peekSegment } = await import('../src/game/logic.js');
const demo = { lanes: [ { solution: [0,1,2,3,4,5,6] }, { solution: [10,11,12,13] } ] };
const drawn = [[0,1,99], [10]];
const before = JSON.stringify(drawn);
const trail = peekSegment(demo, drawn);
if (trail.lane !== 0 || JSON.stringify(trail.cells) !== '[1,2,3,4]') fail('Peek must continue from last correct cell');
if (JSON.stringify(drawn) !== before) fail('Peek changed player rails');
if (peekSegment(demo, [[0,1,2,3,4,5,6], [10]]).lane !== 1) fail('Peek must skip complete lanes');
if (JSON.stringify(peekSegment(demo, [[0,1,2,3,4], [10]]).cells) !== '[4,5]') fail('Peek exposed entire remaining path');
if (peekSegment(demo, demo.lanes.map(l => l.solution)) !== null) fail('Completed board needs no preview');
console.log('Partial peek checks OK');

const puzzleKeys = new Map();
for (const [i, d] of LEVEL_DATA.entries()) {
  const key = puzzleKey(d);
  if (puzzleKeys.has(key)) fail('Equivalent puzzles: ' + puzzleKeys.get(key) + ' and ' + (i+1));
  puzzleKeys.set(key, i+1);
  if (i >= 5 && i < 60 && solveStats(getLevel(i+1), 2).nodes > 24) fail('Beginner puzzle too complex');
}
const sample = LEVEL_DATA[5];
const reverse = { ...sample, entry: sample.exit, exit: sample.entry, solution: [...sample.solution].reverse(), difficulty: 4, nodes: 999 };
if (puzzleKey(sample) !== puzzleKey(reverse)) fail('Direction and metadata must not hide a duplicate');
const mirror = {
  ...sample,
  entry: [sample.entry[0], sample.cols-1-sample.entry[1], [0,3,2,1][sample.entry[2]]],
  exit: [sample.exit[0], sample.cols-1-sample.exit[1], [0,3,2,1][sample.exit[2]]],
  solution: sample.solution.map(i => Math.floor(i/sample.cols)*sample.cols + sample.cols-1-i%sample.cols),
};
if (puzzleKey(sample) !== puzzleKey(mirror)) fail('Reflection must not hide a duplicate');
console.log('All 120 puzzles distinct, including rotations, reflections, reversed travel and lane ordering.');
