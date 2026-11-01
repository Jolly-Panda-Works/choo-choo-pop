// In-app purchases behind one interface. Plug the real store in later (Google Play Billing, Cafe Bazaar, Myket ...):
//
//   registerBillingProvider({
//     init(): Promise<void>,
//     getPrices(): Promise<Record<productId, string>>,      // already formatted, e.g. "۴۹٬۰۰۰ تومان"
//     purchase(productId): Promise<boolean | { token }>,    // truthy when paid (token = store receipt of the purchase)
//     restore(): Promise<string[]>,                         // product ids the player already owns (non-consumables)
//     finish?(productId, token): Promise<void>,             // optional: after the goods were granted (e.g. consume a coin pack)
//     pending?(): Promise<{ productId, token }[]>,          // optional: paid but not yet granted/consumed (app died mid-purchase)
//   })
// The Cafe Bazaar provider of the Bazaar build lives in bazaar.js and is registered in main.jsx.
//
// Product ids are in config.js (COIN_PACKS, REMOVE_ADS_ID). Consumables (coins) are granted here, right after a
// successful purchase; "remove ads" sets save.adsRemoved.
// Without a provider (and with mock services off) nothing can be bought - production never hands out free coins.
import { COIN_PACKS, REMOVE_ADS_ID, MOCK_SERVICES } from '../config.js';
import { addCoins, update } from '../store.js';

let provider = null;
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
  if (pack) addCoins(pack.coins);
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
      return (await active()?.getPrices?.()) || {};
    } catch (e) {
      return {};
    }
  },
  /** Resolves true when the purchase succeeded and was granted. */
  async buy(productId) {
    const p = active();
    if (!p) return false;
    let r = false;
    try {
      r = await p.purchase(productId);
    } catch (e) {
      r = false;
    }
    if (!r) return false;
    const token = typeof r === 'object' ? r.token : undefined;
    if (token) rememberGranted(token);
    grant(productId);
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
      const done = grantedTokens();
      for (const { productId, token } of (await p.pending()) || []) {
        if (!done.has(token)) {
          rememberGranted(token);
          grant(productId);
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
