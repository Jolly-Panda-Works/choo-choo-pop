import assert from 'node:assert/strict';
import { priceInRials } from '../src/services/storePrice.js';

for (const [label, expected] of [
  ['۴۹٬۰۰۰ تومان', 490000], ['IRR 490,000', 490000], ['٤٩٠٠٠ ریال', 49000],
  ['2,3 تومان', null], ['۲۰۰', null], ['$0.99', null], [undefined, null],
  ['IRR 20 تومان', null], ['0 ریال', null],
]) assert.equal(priceInRials(label), expected, label);

console.log('Marketplace currency conversion passed.');
