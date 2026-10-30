import { getLevel, levelCount } from '../src/game/levels.js';
import { evaluate, stepOnto, startPath, initialPath, applyHint } from '../src/game/logic.js';
import { solveStats } from '../src/game/solver.js';
import { analyzePath, coachFor } from '../src/game/tutorial.js';
import { TOTAL_LEVELS, TUTORIAL_LEVELS } from '../src/game/constants.js';

const fail = (m) => {
  throw new Error(m);
};
if (levelCount !== TOTAL_LEVELS) fail(`levelData has ${levelCount} levels but TOTAL_LEVELS is ${TOTAL_LEVELS}`);

let prev = null;
for (let n = 1; n <= levelCount; n++) {
  const lv = getLevel(n);
  let path = initialPath(lv);
  for (const cell of lv.solution.slice(1)) path = stepOnto(lv, path, cell);
  if (!evaluate(lv, path).solved) fail('Level ' + n + ': solution rejected');
  let hp = startPath(lv);
  for (let i = 0; i < lv.solution.length + 3; i++) hp = applyHint(lv, hp);
  if (!evaluate(lv, hp).solved) fail('Level ' + n + ': hints do not solve it');
  const st = solveStats(lv, 2);
  if (st.found !== 1) fail(`Level ${n}: ${st.found} solutions (expected exactly 1)`);

  // --- tutorial rules: 3x3 and a coach message at every stage
  if (n <= TUTORIAL_LEVELS) {
    if (lv.rows !== 3 || lv.cols !== 3) fail(`Level ${n}: tutorial levels must be 3x3`);
    if (lv.difficulty !== 0) fail(`Level ${n}: tutorial levels must have difficulty 0`);
    if (!coachFor(lv, startPath(lv), false)?.text) fail(`Level ${n}: no coach text at start`);
    const wrongPath = lv.preset || null;
    if (n === 4 && (!wrongPath || analyzePath(lv, wrongPath).wrong === 0)) fail('Level 4 must start with a wrong rail');
    if (n === 5 && lv.given.length === 0) fail('Level 5 must teach the star tile');
    if (n === 5 && solveStats({ ...lv, given: [] }, 2).found < 2) fail('Level 5: the star must be what makes the answer unique');
  } else {
    if (lv.difficulty === 0) fail(`Level ${n}: only levels 1-${TUTORIAL_LEVELS} may be tutorial`);
    // honest curve: the board never shrinks and difficulty label never goes down
    const area = lv.rows * lv.cols;
    if (prev && area < prev.area) fail(`Level ${n}: board got smaller than level ${n - 1}`);
    if (prev && lv.difficulty < prev.difficulty) fail(`Level ${n}: difficulty label went down`);
    // kid-friendly caps
    if (lv.rows > 6 || lv.cols > 6) fail(`Level ${n}: bigger than 6x6`);
  }
  prev = { area: lv.rows * lv.cols, difficulty: lv.difficulty, nodes: st.nodes };
  const label = ['tutorial', 'easy', 'medium', 'hard'][lv.difficulty];
  console.log(
    `level ${String(n).padStart(2)}: ${lv.rows}x${lv.cols} ${label.padEnd(8)} ${String(lv.solution.length).padStart(2)} rails, ${lv.given.length} star tiles, search nodes ${String(st.nodes).padStart(5)} - unique solution OK`,
  );
}
console.log(`\nall ${levelCount} levels OK`);
