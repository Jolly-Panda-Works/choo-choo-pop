export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

// Bazaar and Myket always use Persian. Standalone builds keep the language preference.
export const IS_IRANIAN_STORE = typeof __IS_IRANIAN_STORE__ !== 'undefined' && __IS_IRANIAN_STORE__;
export const IS_WEB_DEMO = import.meta.env.VITE_WEB_DEMO === '1';
export const APP_DOWNLOAD_URL = 'https://jollypanda.ir/en/games/choo-choo-pop/';
export const DEFAULT_LANG = 'fa';

export const CREDITS = { author: 'Usef Farahmand', website: 'https://www.useffarahmand.com' };

// Test services (fake ads, free fake purchases) are only on in dev builds, or when you build with VITE_MOCK_SERVICES=1.
// A production build with no real ad/billing provider registered shows no ads and sells nothing (see src/services).
export const MOCK_SERVICES = !IS_WEB_DEMO && (!!import.meta.env.DEV || import.meta.env.VITE_MOCK_SERVICES === '1');

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
// `extra` = the "% extra" sticker of the coin shop; the bonus coins shown are the extra part of `coins`.
export const COIN_PACKS = [
  { id: 'coins_giant', coins: 4000, extra: 40, name: 'giantPack', tag: 'bestDeal' },
  { id: 'coins_large', coins: 1600, extra: 20, name: 'wildPack' },
  { id: 'coins_medium', coins: 700, extra: 15, name: 'happyPack', tag: 'usersChoice' },
  { id: 'coins_small', coins: 200, extra: 5, name: 'pandaPack' },
];
export const packBonus = (p) => Math.round((p.coins * p.extra) / (100 + p.extra));
// coins from the optional rewarded video
export const VIDEO_COINS = 100;

// Power-ups: unlocked one at a time from stage 4 on. Bought with coins in the shop, also given by missions.
export const START_POWERUPS = 2; // of each kind
export const PEEK_MS = 3200;
export const IDLE_HINT_MS = 5000; // no move for this long: the finger shows where to drag
export const POWERUPS = [
  { id: 'freeze', price: 50 },
  { id: 'peek', price: 60 }, // briefly shows the next few cells of one unfinished lane
];
export { POWERUP_PACKS } from './game/powerupPacks.js';
export const REMOVE_ADS_ID = 'remove_ads';

// A skippable ad after every 4th or 5th finished level (never in the tutorial, never after removing ads)
export const AD_EVERY = [4, 5];
