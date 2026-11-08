import assert from 'node:assert/strict';
import { POWERUP_PACKS, purchasePowerupPack } from '../src/game/powerupPacks.js';
assert.equal(POWERUP_PACKS.length,4);
assert.equal(new Set(POWERUP_PACKS.map(p=>p.id)).size,4);
for(const power of ['freeze','peek']) {
 const packs=POWERUP_PACKS.filter(p=>p.power===power);
 assert.equal(packs.length,2);
 assert.ok(packs[1].price/packs[1].count < packs[0].price/packs[0].count);
}
for(const p of POWERUP_PACKS){
 const state={taught:{freeze:true,peek:true},coins:p.price,powerups:{freeze:2,peek:5}};
 const snapshot=JSON.stringify(state);
 const patch=purchasePowerupPack(state,p.id);
 assert.equal(patch.coins,0);assert.equal(patch.powerups[p.power],state.powerups[p.power]+p.count);
 const other=p.power==='peek'?'freeze':'peek';assert.equal(patch.powerups[other],state.powerups[other]);
 assert.equal(JSON.stringify(state),snapshot);
 assert.equal(purchasePowerupPack({...state,coins:p.price-1},p.id),null);
 const again=purchasePowerupPack({...state,...patch,coins:p.price},p.id);
 assert.equal(again.powerups[p.power],state.powerups[p.power]+2*p.count);
}
assert.equal(purchasePowerupPack({coins:999,powerups:{}},'unknown'),null);
assert.equal(purchasePowerupPack({coins:NaN,powerups:{}},'freeze_small'),null);
console.log('All four power-up packs: purchase, insufficient coins, repeated purchases and inventory OK');
import { readFileSync } from 'node:fs';
for (const file of [...POWERUP_PACKS.map(p=>p.art),'note-dot-v1.png','note-cross-v1.png']) {
 const bytes=readFileSync(new URL('../public/choo-choo-pop-assets/art/ui/'+file,import.meta.url));
 assert.equal(bytes.subarray(1,4).toString(),'PNG');
 assert.ok(bytes.readUInt32BE(16)>=128 && bytes.readUInt32BE(20)>=128);
 assert.equal(bytes[25],6,'Sprites must preserve RGBA transparency');
}
console.log('All six shop and board sprites exist with RGBA transparency');

assert.equal(purchasePowerupPack({coins:999,powerups:{},taught:{}},'freeze_small'),null);
