import assert from 'node:assert/strict';
import { introductionLessons, CONTROL_LESSONS } from '../src/game/introductions.js';
import { getLevel } from '../src/game/levels.js';
assert.deepEqual(introductionLessons(getLevel(1)).map(l=>l.id),['undo','redo','restart']);
const taught={}; for(const l of CONTROL_LESSONS){
 const previous={...taught};
 assert.ok(introductionLessons(getLevel(l.level),previous).some(x=>x.id===l.id));
 if(l.level>1) assert.ok(!introductionLessons(getLevel(l.level-1),previous).some(x=>x.id===l.id));
 taught[l.id]=true;
}
assert.deepEqual(introductionLessons(getLevel(40),taught),[]);
assert.ok(introductionLessons(getLevel(46),taught).some(l=>l.power==='freeze'));
assert.ok(!introductionLessons(getLevel(45),taught).some(l=>l.power==='freeze'));
assert.deepEqual(introductionLessons(getLevel(61),taught,{freeze:true}).map(l=>l.id),['power_peek','fixedLesson']);
assert.deepEqual(introductionLessons(getLevel(61),{...taught,fixedLesson:true},{freeze:true,peek:true}),[]);
assert.ok(introductionLessons(getLevel(71),taught,{freeze:true,peek:true}).some(l=>l.id==='wallLesson'));
console.log('Introduction schedule, catch-up, power unlock lessons and seen-state OK');
