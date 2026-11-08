import assert from 'node:assert/strict';
import { demoHintSpend, demoSocialReward, DEMO_SOCIALS, demoDownloadUrl } from '../src/demo/rules.js';

let save = { demoHints: 5, demoSocialClaimed: [], demoSocialPending: null };
for (let i=0;i<5;i++) save = { ...save, ...demoHintSpend(save) };
assert.equal(save.demoHints, 0);
assert.equal(demoHintSpend(save), null);
assert.equal(demoSocialReward(save, 'telegram'), null);
assert.deepEqual(DEMO_SOCIALS.map(s=>s.id), ['telegram']);
for (const {id} of DEMO_SOCIALS) {
  save = { ...save, demoSocialPending: id };
  const reward = {provider:id, id:'verified-grant', amount:2};
  const patch = demoSocialReward(save, reward);
  assert.ok(patch);
  save = JSON.parse(JSON.stringify({ ...save, ...patch }));
  assert.equal(demoSocialReward(save, reward), null);
}
assert.equal(save.demoHints, 2);
assert.equal(demoSocialReward({ ...save, demoSocialPending: 'fake' }, 'fake'), null);
assert.match(demoDownloadUrl('fa'), /\/fa\//);
assert.match(demoDownloadUrl('en'), /\/en\//);
console.log('Demo hint limits, one-time social rewards and locale download URLs passed.');
