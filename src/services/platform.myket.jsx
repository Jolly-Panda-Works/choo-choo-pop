// Myket build: the same hooks as platform.bazaar.jsx. Myket has no sign-in, cloud save or in-app update service to plug in.
import { Icon } from '../ui/icons.jsx';
import { startTapsellAds } from './tapsellAds.js';
import { registerBillingProvider, billing } from './billing.js';
import { Myket, myketAvailable, myketProvider, myketSupported } from './myket.js';

// kept here and not in i18n.js, so main's i18n.js merges cleanly
const TEXT = {
  en: { rate: 'Rate and review', more: 'More games' },
  fa: { rate: 'نظر و امتیاز', more: 'بازی‌های دیگر' },
};

const open = (page) => Myket.open({ page }).catch(() => {});

export function startPlatform() {
  startTapsellAds();
  // in-app billing needs VITE_MYKET_PUBLIC_KEY, see .env.example
  if (myketSupported()) {
    registerBillingProvider(myketProvider);
    billing.recover(); // finish purchases interrupted last time
    billing.restore(); // a reinstall gets remove_ads back on its own
  }
}

export function usePlatformRows(t) {
  if (!myketAvailable()) return [];
  return [{ key: 'rate', name: TEXT[t.lang].rate, btn: { label: <Icon name="star" />, run: () => open('review') } }];
}

/** The developer's games on Myket, in the About popup. */
export const usePlatformLinks = (t) => (myketAvailable() ? [{ key: 'more', label: TEXT[t.lang].more, run: () => open('developer') }] : []);

export const PlatformOverlay = () => null;
