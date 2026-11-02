// Myket in-app billing (Android). Plugs into src/services/billing.js as a provider, see platform.myket.jsx.
// Native side: android/app/src/myket/kotlin/.../MyketBillingPlugin.kt (ir.myket:billing).
//
// Same shape as src/services/bazaar.js. Setup: docs/MYKET.fa.md.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { COIN_PACKS, REMOVE_ADS_ID } from '../config.js';

export const Myket = registerPlugin('MyketBilling');
const PUBLIC_KEY = import.meta.env.VITE_MYKET_PUBLIC_KEY || '';

/** Product ids that must exist in the Myket panel (same ids as config.js). */
export const MYKET_PRODUCTS = [...COIN_PACKS.map((p) => p.id), REMOVE_ADS_ID];
const CONSUMABLE = new Set(COIN_PACKS.map((p) => p.id));

export const myketAvailable = () => Capacitor.getPlatform() === 'android';
export const myketSupported = () => myketAvailable() && !!PUBLIC_KEY;

let connected = false;
function ensure() {
  if (connected) return Promise.resolve();
  return Myket.connect({ publicKey: PUBLIC_KEY }).then(() => {
    connected = true;
  });
}

// IabHelper runs one operation at a time, a second one throws: every call waits for the one before it.
let queue = Promise.resolve();
function run(task) {
  const result = queue.then(ensure).then(task);
  queue = result.catch(() => {});
  return result.catch((e) => {
    // Myket may have closed the connection; the next call sets it up again
    if (e?.code !== 'CANCELLED') connected = false;
    throw e;
  });
}

export const myketProvider = {
  init: () => run(() => {}).catch(() => {}),

  /** { productId: "۲۰٬۰۰۰ تومان" } - Myket already returns the localized price text. */
  getPrices: () =>
    run(async () => {
      const { list } = await Myket.getSkuDetails({ productIds: MYKET_PRODUCTS });
      return Object.fromEntries((list || []).map((d) => [d.productId, d.price]));
    }),

  /** Opens Myket's pay screen. Resolves { token } when paid, false when the player cancelled. */
  async purchase(productId) {
    try {
      const r = await run(() => Myket.purchase({ productId }));
      return { token: r.purchaseToken };
    } catch (e) {
      if (e?.code === 'CANCELLED') return false;
      throw e;
    }
  },

  /** Called by billing.js after the goods were granted: makes a consumable buyable again. */
  async finish(productId, token) {
    if (!token || !CONSUMABLE.has(productId)) return;
    await run(() => Myket.consume({ purchaseToken: token }));
  },

  /** Non-consumables the player owns (restore purchases). */
  restore: () =>
    run(async () => {
      const { list } = await Myket.getPurchased();
      return (list || []).map((p) => p.productId).filter((id) => !CONSUMABLE.has(id));
    }),

  /** Paid but never granted/consumed (app killed mid-purchase): [{ productId, token }]. */
  pending: () =>
    run(async () => {
      const { list } = await Myket.getPurchased();
      return (list || []).filter((p) => CONSUMABLE.has(p.productId)).map((p) => ({ productId: p.productId, token: p.purchaseToken }));
    }),
};
