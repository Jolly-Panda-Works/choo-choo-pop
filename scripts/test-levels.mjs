import { getLevel, levelCount } from '../src/game/levels.js';
import { evaluate, stepOnto, initialPath, applyHint } from '../src/game/logic.js';
import { countSolutions } from '../src/game/solver.js';

for (let n = 1; n <= levelCount; n++) {
  const lv = getLevel(n);
  let path = initialPath(lv);
  for (const cell of lv.solution.slice(1)) path = stepOnto(lv, path, cell);
  if (!evaluate(lv, path).solved) throw new Error('Level ' + n + ': solution rejected');
  let hp = initialPath(lv);
  for (let i = 0; i < lv.solution.length; i++) hp = applyHint(lv, hp);
  if (!evaluate(lv, hp).solved) throw new Error('Level ' + n + ': hints do not solve it');
  const sols = countSolutions(lv, 2);
  if (sols !== 1) throw new Error(`Level ${n}: ${sols} solutions (expected exactly 1)`);
  console.log(`level ${n}: ${lv.rows}x${lv.cols}, ${lv.solution.length} rails, ${lv.given.length} star tiles - unique solution OK`);
}
