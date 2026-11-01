// Cafe Bazaar in-app billing (Android). Plugs into src/services/billing.js as a provider, see platform.jsx.
// Native side: android/app/src/bazaar/kotlin/.../BazaarBillingPlugin.kt (Poolakey).
//
// Setup, once:
//   1. Cafe Bazaar developer panel -> your app -> in-app products: create the product ids of BAZAAR_PRODUCTS below
//      (type "consumable" for coin packs, "non-consumable" for remove_ads).
//   2. Same panel -> "کلید RSA": copy the key into  VITE_BAZAAR_RSA_KEY  (see .env.example). It is a PUBLIC key.
//   3. npm run cap:sync, then build (see docs/BAZAAR.fa.md).
//
// Flow of a coin pack: purchase -> billing.js grants the coins -> finish() consumes the purchase on Bazaar so it can be
// bought again. If the app dies in between, recover() grants + consumes it on the next start.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { COIN_PACKS, REMOVE_ADS_ID } from '../config.js';

export const Bazaar = registerPlugin('BazaarBilling');
const RSA_KEY = import.meta.env.VITE_BAZAAR_RSA_KEY || '';

/** Product ids that must exist in the Bazaar panel (same ids as config.js). */
export const BAZAAR_PRODUCTS = [...COIN_PACKS.map((p) => p.id), REMOVE_ADS_ID];
const CONSUMABLE = new Set(COIN_PACKS.map((p) => p.id));

export const bazaarSupported = () => Capacitor.getPlatform() === 'android' && !!RSA_KEY;

let connecting = null;
let connected = false;
// (re)connect on demand: Bazaar may not be installed / may be updating; every call just tries again.
function ensure() {
  if (connected) return Promise.resolve();
  if (!connecting)
    connecting = Bazaar.connect({ rsaPublicKey: RSA_KEY })
      .then(() => {
        connected = true;
      })
      .finally(() => {
        connecting = null;
      });
  return connecting;
}

export const bazaarProvider = {
  init: () => ensure().catch(() => {}),

  /** { productId: "۲۰٬۰۰۰ تومان" } - Bazaar already returns the localized price text. */
  async getPrices() {
    await ensure();
    const { list } = await Bazaar.getSkuDetails({ productIds: BAZAAR_PRODUCTS });
    return Object.fromEntries((list || []).map((d) => [d.productId, d.price]));
  },

  /** Opens Bazaar's pay screen. Resolves { token } when paid, false when the player cancelled. */
  async purchase(productId) {
    await ensure();
    try {
      const r = await Bazaar.purchase({ productId });
      return { token: r.purchaseToken };
    } catch (e) {
      if (e?.code === 'CANCELLED') return false;
      throw e;
    }
  },

  /** Called by billing.js after the goods were granted: makes a consumable buyable again. */
  async finish(productId, token) {
    if (!token || !CONSUMABLE.has(productId)) return;
    await ensure();
    await Bazaar.consume({ purchaseToken: token });
  },

  /** Non-consumables the player owns (restore purchases). */
  async restore() {
    await ensure();
    const { list } = await Bazaar.getPurchased();
    return (list || []).map((p) => p.productId).filter((id) => !CONSUMABLE.has(id));
  },

  /** Paid but never granted/consumed (app killed mid-purchase): [{ productId, token }]. */
  async pending() {
    await ensure();
    const { list } = await Bazaar.getPurchased();
    return (list || []).filter((p) => CONSUMABLE.has(p.productId)).map((p) => ({ productId: p.productId, token: p.purchaseToken }));
  },
};
