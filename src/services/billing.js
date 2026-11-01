// In-app purchases behind one interface. Plug the real store in later (Google Play Billing, Cafe Bazaar, Myket ...):
//
//   registerBillingProvider({
//     init(): Promise<void>,
//     getPrices(): Promise<Record<productId, string>>,      // already formatted, e.g. "۴۹٬۰۰۰ تومان"
//     purchase(productId): Promise<boolean>,                // true when paid
//     restore(): Promise<string[]>,                         // product ids the player already owns (non-consumables)
//   })
//
// Product ids are in config.js (COIN_PACKS, REMOVE_ADS_ID). Consumables (coins) are granted here, right after a
// successful purchase; "remove ads" sets save.adsRemoved.
// Without a provider (and with mock services off) nothing can be bought - production never hands out free coins.
import { COIN_PACKS, REMOVE_ADS_ID, MOCK_SERVICES } from '../config.js';
import { addCoins, update } from '../store.js';

let provider = null;
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
    let ok = false;
    try {
      ok = !!(await p.purchase(productId));
    } catch (e) {
      ok = false;
    }
    if (!ok) return false;
    if (productId === REMOVE_ADS_ID) update({ adsRemoved: true });
    const pack = COIN_PACKS.find((c) => c.id === productId);
    if (pack) addCoins(pack.coins);
    return true;
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
