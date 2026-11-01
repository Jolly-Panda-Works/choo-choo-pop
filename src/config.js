export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

// One game in two languages; the player switches in the settings.
// The Cafe Bazaar build (VITE_STORE=bazaar, see package.json scripts) adds Bazaar's services and starts in Persian.
export const STORE = import.meta.env.VITE_STORE === 'bazaar' ? 'bazaar' : 'global';
export const DEFAULT_LANG = STORE === 'bazaar' ? 'fa' : 'en';

export const CREDITS = { author: 'Usef Farahmand', website: 'https://www.useffarahmand.com' };

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
// `extra` = the "% extra" sticker of the coin shop; the bonus coins shown are the extra part of `coins`.
export const COIN_PACKS = [
  { id: 'coins_giant', coins: 4000, extra: 40, name: 'giantPack', tag: 'bestDeal' },
  { id: 'coins_large', coins: 1600, extra: 20, name: 'wildPack' },
  { id: 'coins_medium', coins: 700, extra: 15, name: 'happyPack', tag: 'usersChoice' },
  { id: 'coins_small', coins: 200, extra: 5, name: 'pandaPack' },
];
export const packBonus = (p) => Math.round((p.coins * p.extra) / (100 + p.extra));
// coins from the optional rewarded video / the once-a-day gift of the coin shop
export const VIDEO_COINS = 100;
export const DAILY_GIFT_COINS = 50;

// Power-ups: unlocked from stage 2 on. Bought with coins in the shop, also given by missions.
export const START_POWERUPS = 2; // of each kind
export const PEEK_MS = 3200;
export const POWERUPS = [
  { id: 'star', price: 40 }, // lays one gold star tile (a sure rail)
  { id: 'eraser', price: 40 }, // wipes every wrong rail
  { id: 'peek', price: 60 }, // shows the whole answer for a few seconds
];
export const POWERUP_PACK = 3; // the shop sells them 3 at a time
export const REMOVE_ADS_ID = 'remove_ads';

// A skippable ad after every 4th or 5th finished level (never in the tutorial, never after removing ads)
export const AD_EVERY = [4, 5];
