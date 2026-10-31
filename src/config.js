export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

// Two builds from one code base: "en" (Choo Choo Pop) and "fa" (هو هو چی چی).
// Chosen at build time:  VITE_EDITION=fa npm run build   (see package.json scripts)
export const EDITION = import.meta.env.VITE_EDITION === 'fa' ? 'fa' : 'en';

// Test services (fake ads, free fake purchases) are only on in dev builds, or when you build with VITE_MOCK_SERVICES=1.
// A production build with no real ad/billing provider registered shows no ads and sells nothing (see src/services).
export const MOCK_SERVICES = !!import.meta.env.DEV || import.meta.env.VITE_MOCK_SERVICES === '1';

export * from './game/constants.js';

// ---- economy -------------------------------------------------------------------------------
// coins for the FIRST time a level is cleared:  base[difficulty] + COINS_PER_STAR * stars
export const COIN_BASE = [8, 10, 14, 18, 40]; // tutorial, easy, medium, hard, super hard
export const COINS_PER_STAR = 5;

// Hint packs, bought with coins (small / big)
export const HINT_PACKS = [
  { id: 'hints_small', hints: 3, price: 60 },
  { id: 'hints_big', hints: 10, price: 150 },
];

// Coin packs, bought with real money. Prices come from the store provider (src/services/billing.js).
export const COIN_PACKS = [
  { id: 'coins_small', coins: 200 },
  { id: 'coins_medium', coins: 700, bonus: true },
  { id: 'coins_large', coins: 1600, bonus: true },
];
export const REMOVE_ADS_ID = 'remove_ads';

// A skippable ad after every 4th or 5th finished level (never in the tutorial, never after removing ads)
export const AD_EVERY = [4, 5];
