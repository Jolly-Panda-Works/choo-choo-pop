import assert from 'node:assert/strict';
import { createServer } from 'vite';

const events = [];
const saved = new Map();
globalThis.localStorage = {
  getItem: key => saved.get(key) ?? null,
  setItem: (key, value) => saved.set(key, value),
};
globalThis.recordGameEvent = (name, fields) => events.push({ name, ...fields });
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  plugins: [{
    name: 'capture-metrix-events',
    enforce: 'pre',
    resolveId(id) { if (id.endsWith('/analytics.js')) return '\0capture-analytics'; },
    load(id) {
      if (id === '\0capture-analytics') return `export const track = globalThis.recordGameEvent;
        export const revenue = amount => track('iap_revenue', { amount });`;
    },
  }],
});
try {
  const store = await server.ssrLoadModule('/src/store.js');
  const { billing, registerBillingProvider } = await server.ssrLoadModule('/src/services/billing.js');
  const { ads, registerAdsProvider, getAdReward, claimAdReward } = await server.ssrLoadModule('/src/services/ads.js');

  store.completeLevel(1, 2);
  store.completeLevel(1, 1);
  store.completeLevel(1, 3);
  assert.deepEqual(events.filter(e => e.currency_type === 'star').map(e => e.amount), [2, 1]);
  store.update({ coins: 60 });
  const pack = { id: 'hints_small', hints: 3, price: 60 };
  assert.equal(store.buyHintPack(pack), true);
  assert.equal(store.buyHintPack(pack), false);
  assert.deepEqual(events.slice(-3).map(e => e.name), ['currency_spent', 'item_purchased', 'purchase_blocked']);

  registerAdsProvider({ showRewarded: async () => true });
  await ads.rewarded({ kind: 'hint', placement: 'shop' }, () => store.addHints(1));
  const reward = getAdReward();
  claimAdReward(reward);
  claimAdReward(reward);
  assert.deepEqual(events.slice(-3).map(e => e.name), ['ad_requested', 'ad_result', 'reward_claimed']);

  const productId = 'coins_small';
  const token = 'local-test-token';
  registerBillingProvider({
    getPrices: async () => ({ [productId]: '۴۹٬۰۰۰ تومان' }),
    purchase: async () => ({ token }),
    pending: async () => [{ productId, token }],
  });
  await billing.prices();
  assert.equal(await billing.buy(productId), true);
  assert.equal(await billing.recover(), 0);
  assert.deepEqual(events.filter(e => e.name === 'iap_revenue').map(e => e.amount), [490000]);
  assert.equal(events.some(e => JSON.stringify(e).includes(token)), false);
  console.log('Economy, ad claims and payment analytics passed.');
} finally {
  await server.close();
  delete globalThis.recordGameEvent;
}
