import { Capacitor, registerPlugin } from '@capacitor/core';
import { registerAdsProvider } from './ads.js';

const nativeAds = registerPlugin('Ads');

export function startTapsellAds() {
  if (!Capacitor.isPluginAvailable('Ads')) return;

  // One caller owns the native ad from request until dismissal. Extra taps earn nothing.
  let busy = false;
  const show = async (placement) => {
    if (busy) return false;
    busy = true;
    try {
      await nativeAds.prepare({ placement });
      const result = await nativeAds.show({ placement });
      return result.rewarded === true;
    } finally {
      busy = false;
    }
  };

  registerAdsProvider({
    isRewardedReady: () => true,
    showRewarded: () => show('rewarded'),
    showInterstitial: () => show('interstitial'),
  });
}
