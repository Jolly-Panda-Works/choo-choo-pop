import { useSyncExternalStore } from 'react';
import {
  START_HINTS,
  START_COINS,
  TUTORIAL_LEVELS,
  COIN_BASE,
  COINS_PER_STAR,
  AD_EVERY,
} from './config.js';
import { levelCount } from './game/levels.js';

const KEY = 'choochoopop.save.v3';
const OLD_KEY = 'choochoopop.save.v2';

const pickAdTarget = () => AD_EVERY[Math.floor(Math.random() * AD_EVERY.length)];

const defaults = () => ({
  unlocked: 1, // highest level number the player may play
  stars: {}, // level number -> 1..3
  hints: START_HINTS,
  coins: START_COINS,
  sound: true,
  vibrate: true,
  storySeen: false,
  adsRemoved: false,
  adCount: 0, // finished levels since the last ad
  adTarget: pickAdTarget(),
  trainSkin: 'classic',
  pandaSkin: 'classic',
  ownedTrain: ['classic'],
  ownedPanda: ['classic'],
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
    // migrate the old single-stage save (levels, stars, hints, settings)
    const old = localStorage.getItem(OLD_KEY);
    if (old) {
      const o = JSON.parse(old);
      return { ...defaults(), ...o, storySeen: true };
    }
  } catch (e) {
    /* ignore */
  }
  return defaults();
}

let state = load();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    /* storage unavailable */
  }
}

export const getState = () => state;
export function update(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  persist();
  listeners.forEach((l) => l());
}
export function useSave() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

/**
 * Record a finished level.
 * Coins: first clear = base(difficulty) + 5 per star; clearing again with more stars pays 5 per extra star.
 * Returns { first, coins, hintBonus }.
 */
export function completeLevel(level, stars, difficulty = 1) {
  let res = { first: false, coins: 0, hintBonus: false };
  update((s) => {
    const prev = s.stars[level] || 0;
    const first = prev === 0;
    const coins = first ? COIN_BASE[difficulty] + COINS_PER_STAR * stars : Math.max(0, stars - prev) * COINS_PER_STAR;
    // a free hint for every second level finished for the first time (after the tutorial)
    const hintBonus = first && level > TUTORIAL_LEVELS && level % 2 === 0;
    res = { first, coins, hintBonus };
    return {
      stars: { ...s.stars, [level]: Math.max(prev, stars) },
      unlocked: Math.min(levelCount, Math.max(s.unlocked, level + 1)),
      hints: hintBonus ? s.hints + 1 : s.hints,
      coins: s.coins + coins,
    };
  });
  return res;
}

export const spendHint = () => update((s) => ({ hints: Math.max(0, s.hints - 1) }));
export const addHints = (n) => update((s) => ({ hints: s.hints + n }));
export const addCoins = (n) => update((s) => ({ coins: s.coins + n }));

/** Pay with coins. Returns false (and changes nothing) when there are not enough. */
export function spendCoins(n) {
  if (state.coins < n) return false;
  update((s) => ({ coins: s.coins - n }));
  return true;
}

export function buyHintPack(pack) {
  if (!spendCoins(pack.price)) return false;
  addHints(pack.hints);
  return true;
}

/** kind: 'train' | 'panda' */
export function buySkin(kind, skin) {
  const owned = kind === 'train' ? 'ownedTrain' : 'ownedPanda';
  if (state[owned].includes(skin.id)) return true;
  if (!spendCoins(skin.price)) return false;
  update((s) => ({ [owned]: [...s[owned], skin.id] }));
  return true;
}
export const equipSkin = (kind, id) => update(kind === 'train' ? { trainSkin: id } : { pandaSkin: id });

/**
 * Count a finished level towards the next ad. Returns true when an ad is due now
 * (and resets the counter). Never counts the tutorial; never due after "remove ads".
 */
export function tickAdCounter(levelNo) {
  if (state.adsRemoved || levelNo <= TUTORIAL_LEVELS) return false;
  const n = state.adCount + 1;
  if (n >= state.adTarget) {
    update({ adCount: 0, adTarget: pickAdTarget() });
    return true;
  }
  update({ adCount: n });
  return false;
}

export const totalStars = (s) => Object.values(s.stars).reduce((a, b) => a + b, 0);
export const starsInRange = (s, from, to) => {
  let n = 0;
  for (let i = from; i <= to; i++) n += s.stars[i] || 0;
  return n;
};
export const resetProgress = () =>
  update({ unlocked: 1, stars: {}, hints: START_HINTS, adCount: 0, storySeen: false });
