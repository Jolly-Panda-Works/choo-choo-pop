import { useSyncExternalStore } from 'react';
import { START_HINTS, TOTAL_LEVELS, TUTORIAL_LEVELS } from './config.js';

const KEY = 'choochoopop.save.v2';
const defaults = {
  unlocked: 1,
  stars: {},
  hints: START_HINTS,
  sound: true,
  vibrate: true,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch (e) {
    /* ignore */
  }
  return { ...defaults };
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

/** Record a finished level. Returns true when it was the first completion. */
export function completeLevel(level, stars) {
  let first = false;
  update((s) => {
    const prev = s.stars[level] || 0;
    first = prev === 0;
    return {
      stars: { ...s.stars, [level]: Math.max(prev, stars) },
      unlocked: Math.min(TOTAL_LEVELS, Math.max(s.unlocked, level + 1)),
      // a free hint for every second level finished for the first time (after the tutorial)
      hints: first && level > TUTORIAL_LEVELS && level % 2 === 0 ? s.hints + 1 : s.hints,
    };
  });
  return first;
}

export const spendHint = () => update((s) => ({ hints: Math.max(0, s.hints - 1) }));
export const totalStars = (s) => Object.values(s.stars).reduce((a, b) => a + b, 0);
