import { useEffect, useState } from 'react';
import { subscribeMockAds } from '../services/ads.js';
import { useT } from '../i18n.js';

/** Placeholder ad window used ONLY with the mock provider (dev builds). A real SDK draws its own ad. */
export default function AdHost() {
  const t = useT();
  const [ad, setAd] = useState(null);
  const [left, setLeft] = useState(0);
  useEffect(() => subscribeMockAds((a) => { setAd(a); setLeft(a.kind === 'rewarded' ? 3 : 1); }), []);
  useEffect(() => {
    if (!ad || left <= 0) return undefined;
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [ad, left]);
  if (!ad) return null;
  const close = (reward) => {
    ad.done(ad.kind === 'rewarded' ? reward : undefined);
    setAd(null);
  };
  return (
    <div className="ad-host">
      <div className="ad-card">
        <b>{t('adTest')}</b>
        <p>{ad.kind === 'rewarded' ? t('adRewardedTest') : t('adInterstitialTest')}</p>
        {ad.kind === 'rewarded' ? (
          <button className="btn big yellow" disabled={left > 0} onClick={() => close(true)}>
            {left > 0 ? t.n(left) : t('claim')}
          </button>
        ) : null}
        <button className="btn" disabled={ad.kind === 'interstitial' && left > 0} onClick={() => close(false)}>
          {ad.kind === 'rewarded' ? t('closeNoReward') : t('skipAd')}
        </button>
      </div>
    </div>
  );
}
