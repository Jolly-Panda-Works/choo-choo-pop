// In-app purchases behind one interface. A store build plugs its provider in from src/services/platform.jsx:
//
//   registerBillingProvider({
//     init(): Promise<void>,
//     getPrices(): Promise<Record<productId, string>>,      // already formatted, e.g. "۴۹٬۰۰۰ تومان"
//     purchase(productId): Promise<boolean | { token }>,    // truthy when paid (token = store receipt of the purchase)
//     restore(): Promise<string[]>,                         // product ids the player already owns (non-consumables)
//     finish?(productId, token): Promise<void>,             // optional: after the goods were granted (e.g. consume a coin pack)
//     pending?(): Promise<{ productId, token }[]>,          // optional: paid but not yet granted/consumed (app died mid-purchase)
//   })
//
// Product ids are in config.js (COIN_PACKS, REMOVE_ADS_ID). Consumables (coins) are granted here, right after a
// successful purchase; "remove ads" sets save.adsRemoved.
// Without a provider (and with mock services off) nothing can be bought - production never hands out free coins.
import { COIN_PACKS, REMOVE_ADS_ID, MOCK_SERVICES } from '../config.js';
import { priceInRials } from './storePrice.js';
import { revenue, track } from './analytics.js';
import { addCoins, getState, update } from '../store.js';

let provider = null;
let prices = {};
function reportSale(productId, amount, result) {
  track('iap_result', { product_id: productId, store: __STORE__, result });
  if (amount) revenue(amount);
}
// tokens already granted on this device, so a purchase whose consume failed is never granted twice
const GRANTED_KEY = 'ccp.grantedTokens';
const grantedTokens = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(GRANTED_KEY) || '[]'));
  } catch (e) {
    return new Set();
  }
};
const rememberGranted = (token) => {
  try {
    const s = grantedTokens();
    s.add(token);
    localStorage.setItem(GRANTED_KEY, JSON.stringify([...s].slice(-50)));
  } catch (e) {
    /* ignore */
  }
};
function grant(productId) {
  if (productId === REMOVE_ADS_ID) update({ adsRemoved: true });
  const pack = COIN_PACKS.find((c) => c.id === productId);
  if (pack) addCoins(pack.coins, 'iap');
}
export function registerBillingProvider(p) {
  provider = p;
  try {
    p.init?.();
  } catch (e) {
    /* ignore */
  }
}

const mock = {
  getPrices: async () => ({ coins_small: '$0.99', coins_medium: '$2.99', coins_large: '$5.99', coins_giant: '$9.99', remove_ads: '$3.99' }),
  purchase: () => new Promise((r) => setTimeout(() => r(true), 500)),
  restore: async () => [],
};
const active = () => provider || (MOCK_SERVICES ? mock : null);

export const billing = {
  available: () => !!active(),
  async prices() {
    try {
      prices = (await active()?.getPrices?.()) || {};
      return prices;
    } catch (e) {
      return {};
    }
  },
  /** Resolves true when the purchase succeeded and was granted. */
  async buy(productId) {
    const p = active();
    if (!p) return false;
    const amount = priceInRials(prices[productId]);
    if (p !== mock) {
      track('iap_started', { product_id: productId, store: __STORE__ });
      update(s => ({ purchaseQuotes: { ...s.purchaseQuotes, [productId]: amount } }));
    }
    let r = false;
    try {
      r = await p.purchase(productId);
    } catch (e) {
      if (p !== mock) reportSale(productId, null, 'failed');
      return false;
    }
    if (!r) {
      if (p !== mock) reportSale(productId, null, 'cancelled');
      return false;
    }
    const token = typeof r === 'object' ? r.token : undefined;
    if (!token || !grantedTokens().has(token)) {
      if (token) rememberGranted(token);
      grant(productId);
      if (p !== mock) reportSale(productId, amount, 'success');
    }
    try {
      await p.finish?.(productId, token); // e.g. consume the coin pack; a failure is retried by recover()
    } catch (e) {
      /* ignore */
    }
    return true;
  },
  /** Grants + consumes purchases that were paid but never finished (call once at start). Returns how many were granted. */
  async recover() {
    const p = active();
    if (!p?.pending) return 0;
    let n = 0;
    try {
      for (const { productId, token } of (await p.pending()) || []) {
        if (!grantedTokens().has(token)) {
          rememberGranted(token);
          grant(productId);
          reportSale(productId, getState().purchaseQuotes?.[productId], 'recovered');
          n++;
        }
        try {
          await p.finish?.(productId, token);
        } catch (e) {
          /* try again next start */
        }
      }
    } catch (e) {
      /* store not reachable */
    }
    return n;
  },
  async restore() {
    try {
      const ids = (await active()?.restore?.()) || [];
      if (ids.includes(REMOVE_ADS_ID)) update({ adsRemoved: true });
      return ids.length;
    } catch (e) {
      return 0;
    }
  },
};
