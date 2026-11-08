import assert from 'node:assert/strict';
import { DEMO_LEVELS } from '../src/demo/levels.js';
import { hydrateLevel } from '../src/game/levels.js';
import { solveStats } from '../src/game/solver.js';
import { evaluate } from '../src/game/logic.js';
import { puzzleKey } from './puzzle-key.mjs';
assert.equal(DEMO_LEVELS.length,10);const keys=new Set();let previous=0;
for(const [i,d] of DEMO_LEVELS.entries()){
 const l=hydrateLevel(d,d.sourceId), stats=solveStats(l,2);
 assert.equal(stats.found,1);assert.ok(stats.nodes>previous);previous=stats.nodes;
 assert.equal(evaluate(l,l.lanes.map(x=>x.solution)).solved,true);
 assert.ok(!keys.has(puzzleKey(d)));keys.add(puzzleKey(d));
 console.log(`Demo ${i+1}: ${l.rows}x${l.cols}, difficulty=${l.difficulty}, solver=${stats.nodes}`);
}
assert.equal(DEMO_LEVELS.at(-1).difficulty,4);
