import assert from 'node:assert/strict';
import { timeTargets, timedStars, formatTime, createPlayClock } from '../src/game/timing.js';
import { getLevel, levelCount } from '../src/game/levels.js';
import { restoreDraft, boardSignature, freshBoard } from '../src/game/boardState.js';
for (let n=1;n<=levelCount;n++) {
  const targets=timeTargets(getLevel(n));
  assert.ok(Number.isFinite(targets.threeMs) && targets.threeMs>0);
  assert.ok(targets.twoMs>targets.threeMs);
  assert.equal(timedStars(0,targets),3);
  assert.equal(timedStars(targets.threeMs,targets),3);
  assert.equal(timedStars(targets.threeMs+1,targets),2);
  assert.equal(timedStars(targets.twoMs,targets),2);
  assert.equal(timedStars(targets.twoMs+1,targets),1);
  assert.equal(timedStars(1e12,targets),1);
}
const easy=getLevel(6), base=timeTargets(easy).threeMs;
assert.ok(timeTargets({...easy,difficulty:3}).threeMs>base);
assert.ok(timeTargets({...easy,rows:6,cols:6}).threeMs>base);
assert.ok(timeTargets({...easy,lanes:[...easy.lanes,...easy.lanes]}).threeMs>base);
assert.ok(timeTargets({...easy,nodes:10000}).threeMs>base);
let now=0;const clock=createPlayClock(5000,()=>now);
clock.start(); now=1000; assert.equal(clock.read(),6000);
clock.start(); now=2000; assert.equal(clock.stop(),7000);
now=50000; assert.equal(clock.read(),7000); // hidden/background time
clock.start();now=51000;assert.equal(clock.stop(),8000);
const draft={signature:boardSignature(easy),past:[],present:freshBoard(easy),future:[],elapsedMs:clock.read()};
const restored=restoreDraft(easy,JSON.parse(JSON.stringify(draft)));
now=90000;const resumed=createPlayClock(restored.elapsedMs,()=>now);
resumed.start();now=91000;assert.equal(resumed.read(),9000); // offline time excluded
resumed.reset(); assert.equal(resumed.read(),0);
assert.equal(createPlayClock(NaN).read(),0);
assert.equal(createPlayClock(-4).read(),0);
assert.equal(formatTime(65000),'1:05');
assert.equal(formatTime(3600000),'60:00');
console.log('Timer pause/resume/reset, saved time and all 120 star thresholds OK');
import { FREEZE_MS, TIMER_FIRST_LEVEL, POWERUP_TEACH } from '../src/game/constants.js';
import { timerFill } from '../src/game/timing.js';
assert.equal(TIMER_FIRST_LEVEL,41);
assert.equal(POWERUP_TEACH.freeze,46);
let freezeNow=0; const frozenClock=createPlayClock(2000,()=>freezeNow);
frozenClock.start(); assert.equal(frozenClock.freeze(FREEZE_MS),true);
assert.equal(frozenClock.freeze(FREEZE_MS),false);
freezeNow=6000;assert.equal(frozenClock.read(),2000);assert.equal(frozenClock.remainingFreeze(),4000);
frozenClock.stop();freezeNow=60000;assert.equal(frozenClock.remainingFreeze(),4000);
frozenClock.start();freezeNow=65000;assert.equal(frozenClock.read(),3000);assert.equal(frozenClock.remainingFreeze(),0);
const restoredFreeze=createPlayClock(2000,()=>freezeNow,4000);restoredFreeze.start();freezeNow=70000;assert.equal(restoredFreeze.read(),3000);
assert.equal(timerFill(0,{twoMs:100}),1);assert.equal(timerFill(120,{twoMs:100}),0);
assert.equal(timerFill(1e9,{twoMs:100}),0);
console.log('Freeze duration, persistence, pause and unlock checks OK');
