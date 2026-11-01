// Cafe Bazaar build: this file replaces the empty hooks of main (see there), everything Bazaar plugs in here.
import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { useT } from '../i18n.js';
import { registerBillingProvider, billing } from './billing.js';
import { bazaarProvider, bazaarSupported } from './bazaar.js';
import {
  bazaarAppAvailable,
  bazaarAutoUpdate,
  enableBazaarAutoUpdate,
  moreGamesAvailable,
  openMoreGames,
  putOffBazaarUpdate,
  rateOnBazaar,
  signInWithBazaar,
  signOutOfBazaar,
  startBazaarApp,
  updateFromBazaar,
  useBazaarLogin,
  useBazaarUpdate,
} from './bazaarApp.js';

// kept here and not in i18n.js, so main's i18n.js merges cleanly
const TEXT = {
  en: {
    signIn: 'Sign in with Bazaar',
    signOut: 'Signed in: tap to sign out',
    connected: 'Signed in with Bazaar',
    cancelled: 'Sign in was cancelled',
    needsLogin: 'Log in to Bazaar, then come back',
    failed: 'Could not sign in. Try again later.',
    rate: 'Rate and review',
    more: 'More games',
    autoUpdate: 'Turn on auto-update',
    updateTitle: 'New version!',
    updateBody: 'A new version is out in Cafe Bazaar. Update now?',
    updateNow: 'Update',
    updateLater: 'Later',
  },
  fa: {
    signIn: 'ورود با بازار',
    signOut: 'وارد شدی؛ برای خروج بزن',
    connected: 'با بازار وارد شدی',
    cancelled: 'ورود لغو شد',
    needsLogin: 'اول وارد بازار شو و برگرد',
    failed: 'ورود انجام نشد. بعداً دوباره امتحان کن.',
    rate: 'نظر و امتیاز',
    more: 'بازی‌های دیگر',
    autoUpdate: 'روشن کردن به‌روزرسانی خودکار',
    updateTitle: 'نسخهٔ جدید!',
    updateBody: 'نسخهٔ جدید بازی در کافه‌بازار آمده. الان به‌روز می‌کنی؟',
    updateNow: 'به‌روزرسانی',
    updateLater: 'بعداً',
  },
};

export function startPlatform() {
  // in-app billing needs VITE_BAZAAR_RSA_KEY, see .env.example
  if (bazaarSupported()) {
    registerBillingProvider(bazaarProvider);
    billing.recover(); // finish purchases interrupted last time
  }
  startBazaarApp();
}

export function usePlatformRows(t, say) {
  const text = TEXT[t.lang];
  const available = bazaarAppAvailable();
  const login = useBazaarLogin();
  const [autoUpdate, setAutoUpdate] = useState('unsupported');
  useEffect(() => {
    if (available) bazaarAutoUpdate().then(setAutoUpdate);
  }, [available]);
  if (!available) return [];

  const connected = login === 'connected';
  const rows = [
    {
      key: 'bazaarLogin',
      name: connected ? text.signOut : text.signIn,
      btn: {
        label: connected ? '✓' : '→',
        run: async () => {
          if (connected) return signOutOfBazaar();
          const message = text[await signInWithBazaar()];
          if (message) say(message);
        },
      },
    },
    { key: 'rate', name: text.rate, btn: { label: '★', run: rateOnBazaar } },
  ];
  if (moreGamesAvailable()) rows.push({ key: 'more', name: text.more, btn: { label: '→', run: openMoreGames } });
  if (autoUpdate === 'disabled') {
    rows.push({
      key: 'autoUpdate',
      name: text.autoUpdate,
      btn: {
        label: '↻',
        run: () => {
          enableBazaarAutoUpdate();
          // Bazaar asks the player; check again when they come back
          setTimeout(() => bazaarAutoUpdate().then(setAutoUpdate), 4000);
        },
      },
    });
  }
  return rows;
}

export function PlatformOverlay() {
  const t = useT();
  const [versionCode, close] = useBazaarUpdate();
  if (!versionCode) return null;
  const text = TEXT[t.lang];
  const later = () => {
    putOffBazaarUpdate(versionCode);
    close();
  };
  return (
    <Modal pose="salute" title={text.updateTitle} onClose={later}>
      <p className="small">{text.updateBody}</p>
      <div className="modal-actions">
        <button className="btn" onClick={later}>
          {text.updateLater}
        </button>
        <button
          className="btn"
          onClick={() => {
            updateFromBazaar();
            close();
          }}
        >
          {text.updateNow}
        </button>
      </div>
    </Modal>
  );
}
