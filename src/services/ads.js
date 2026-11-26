// Ad provider shared by the store builds and development mock.
//
//   registerAdsProvider({
//     init(): Promise<void>,
//     isRewardedReady(): boolean,
//     showInterstitial(): Promise<void>,        // skippable ad between levels; resolve when it is closed
//     showRewarded(): Promise<boolean>,         // resolve true only if the player earned the reward
//   })
//
// Game rules (see store.tickAdCounter): an interstitial after every 4th/5th level (not in the tutorial, not after
// "remove ads"); the rewarded ad is always optional ("get 1 hint").
// Without a registered provider (and with mock services off) nothing is ever shown.
import { MOCK_SERVICES } from '../config.js';
import { track } from './analytics.js';
import { getState } from '../store.js';

let provider = null;
const hostListeners = new Set();
const rewardListeners = new Set();
const loadingReward = { kind: 'loading' };
let adReward = null;

export const getAdReward = () => adReward;

export function subscribeAdReward(listener) {
  rewardListeners.add(listener);
  return () => rewardListeners.delete(listener);
}

function setAdReward(reward) {
  adReward = reward;
  rewardListeners.forEach((listener) => listener());
}

export function claimAdReward(reward) {
  if (!reward || adReward !== reward || reward === loadingReward) return;
  setAdReward(null);
  reward.onClaim();
  if (reward.kind !== 'spin') track('reward_claimed', { source: 'ad', reward_id: reward.kind,
    coins: reward.kind === 'coins' ? reward.amount : 0, hints: reward.kind === 'hint' ? 1 : 0 });
}

export function registerAdsProvider(p) {
  provider = p;
  try {
    p.init?.();
  } catch (e) {
    /* ignore */
  }
}

// ---- development mock: the <AdHost/> in App.jsx shows a placeholder ad -------------------------
const mock = {
  isRewardedReady: () => true,
  showInterstitial: () => new Promise((resolve) => hostListeners.forEach((l) => l({ kind: 'interstitial', done: resolve }))),
  showRewarded: () => new Promise((resolve) => hostListeners.forEach((l) => l({ kind: 'rewarded', done: resolve }))),
};
export const subscribeMockAds = (fn) => {
  hostListeners.add(fn);
  return () => hostListeners.delete(fn);
};

const active = () => provider || (MOCK_SERVICES ? mock : null);

export const ads = {
  /** Is there a rewarded ad the player can watch right now? (hides the button when not) */
  rewardedAvailable() {
    const p = active();
    return !!p && !!p.isRewardedReady?.();
  },
  /** Skippable ad between levels. Always resolves (even if the ad failed). */
  async interstitial(level_id) {
    const p = active();
    if (getState().adsRemoved) return;
    const fields = { ad_format: 'interstitial', placement: 'after_level', level_id };
    track('ad_requested', fields);
    if (!p) return track('ad_result', { ...fields, result: 'unavailable' });
    try {
      const shown = await p.showInterstitial();
      track('ad_result', { ...fields, result: shown === false ? 'unavailable' : 'closed' });
    } catch (e) {
      track('ad_result', { ...fields, result: e?.code === 'NO_FILL' ? 'unavailable' : 'failed' });
      /* a failed ad must never block the game */
    }
  },
  /** Offers a claim only after the ad provider confirms completion. */
  async rewarded(reward, onClaim) {
    const p = active();
    if (adReward) return false;
    const fields = { ad_format: 'rewarded', placement: reward.placement, level_id: reward.level_id };
    track('ad_requested', fields);
    if (!p) {
      track('ad_result', { ...fields, result: 'unavailable' });
      return false;
    }
    setAdReward(loadingReward);
    try {
      const earned = await p.showRewarded();
      track('ad_result', { ...fields, result: earned ? 'earned' : 'closed_without_reward' });
      if (!earned) return false;
      setAdReward({ ...reward, onClaim });
      return true;
    } catch (e) {
      track('ad_result', { ...fields, result: e?.code === 'NO_FILL' ? 'unavailable' : 'failed' });
      return false;
    } finally {
      if (adReward === loadingReward) setAdReward(null);
    }
  },
};
