import { getLevel, levelCount } from '../src/game/levels.js';
import { evaluate, stepOnto, startPaths, initialPaths, applyHint, eraseWrong, laneForCell, gateIsOuter, laneEntryIdx, laneExitIdx } from '../src/game/logic.js';
import { solveStats } from '../src/game/solver.js';
import { analyzePath, coachFor } from '../src/game/tutorial.js';
import { STAGE_SIZE, TUTORIAL_LEVELS } from '../src/game/constants.js';

const fail = (m) => {
  throw new Error(m);
};
if (levelCount % STAGE_SIZE !== 0) fail(`levelData has ${levelCount} levels; it must be a whole number of stages (${STAGE_SIZE} each)`);

let prev = null;
for (let n = 1; n <= levelCount; n++) {
  const lv = getLevel(n);
  const stage = Math.ceil(n / STAGE_SIZE);
  const K = lv.lanes.length;

  // --- stage rules: stage 1-2 one track; stage 3 = two tracks for the first 10 levels, then more
  const inStage = ((n - 1) % STAGE_SIZE) + 1;
  if (stage < 3 && K !== 1) fail(`Level ${n}: stages 1-2 have a single track`);
  if (stage === 3) {
    if (inStage <= 10 && K !== 2) fail(`Level ${n}: the first 10 levels of stage 3 need exactly 2 entries/exits`);
    if (inStage > 10 && K < 3) fail(`Level ${n}: levels 11+ of stage 3 need 3 or more entries/exits`);
  }

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
  // super hard rules: stage 1 has exactly one (its last level); later stages have the last two
  {
    const expectSuper = stage === 1 ? inStage === STAGE_SIZE : inStage >= STAGE_SIZE - 1;
    if (expectSuper !== (lv.difficulty === 4)) fail(`Level ${n}: super hard must be ${expectSuper ? 'set' : 'unset'} here`);
    if (lv.difficulty === 4 && prev && st.nodes <= prev.nodes) fail(`Level ${n}: super hard must be harder than the level before`);
  }
  prev = { stage, K, area: lv.rows * lv.cols, difficulty: lv.difficulty, nodes: st.nodes };
  const label = ['tutorial', 'easy', 'medium', 'hard', 'SUPER'][lv.difficulty];
  console.log(
    `level ${String(n).padStart(2)}: ${lv.rows}x${lv.cols} ${label.padEnd(8)} tracks ${K}, ${String(lv.allSolution.length).padStart(2)} rails, ${lv.blocks.length} blocks, ${lv.given.length} star tiles, nodes ${String(st.nodes).padStart(5)} - unique OK`,
  );
}
console.log(`\nall ${levelCount} levels OK`);
