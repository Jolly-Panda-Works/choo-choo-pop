// Cafe Bazaar features on Android, besides billing (src/services/bazaar.js):
// - sign in with Bazaar, with the save kept in Bazaar's in-app storage (10 KB per player), so a new phone continues the game,
// - Bazaar's pages: rate and review, the developer's other games,
// - updates: whether Bazaar has a newer version, the in-app update, auto-update.
// Native side: android/app/src/bazaar/kotlin/.../BazaarBillingPlugin.kt. Setup: docs/BAZAAR.fa.md.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Capacitor } from '@capacitor/core';
import { Bazaar } from './bazaar.js';
import { getState, subscribe, update, totalStars } from '../store.js';

const DEVELOPER_ID = String(import.meta.env.VITE_BAZAAR_DEVELOPER_ID || '').trim();
/** Bazaar's in-app storage holds 10 KB per player; keep a little room. */
const STORAGE_LIMIT = 9500;
/** The player signed out in the game: no automatic sign-in until they sign in again. */
const OFF_KEY = 'ccp.bazaarLoginOff';
const LATER_KEY = 'ccp.bazaarUpdateLater';
const SAVE_DELAY = 3000;
// settings of this phone: they stay when a save comes back from Bazaar
const LOCAL_ONLY = ['sound', 'music', 'vibrate', 'lang', 'adCount', 'adTarget'];

export const bazaarAppAvailable = () => Capacitor.getPlatform() === 'android';
export const moreGamesAvailable = () => bazaarAppAvailable() && !!DEVELOPER_ID;

const storage = (run, fallback) => {
  try {
    return run(localStorage);
  } catch (e) {
    return fallback;
  }
};

// ---- sign-in state, for the settings screen
let login = 'signedOut'; // signedOut | working | connected
const loginListeners = new Set();
const setLogin = (v) => {
  login = v;
  loginListeners.forEach((l) => l());
};
export const useBazaarLogin = () =>
  useSyncExternalStore(
    (cb) => {
      loginListeners.add(cb);
      return () => loginListeners.delete(cb);
    },
    () => login,
  );

// ---- save
function snapshot() {
  const s = { ...getState() };
  LOCAL_ONLY.forEach((k) => delete s[k]);
  let text = JSON.stringify(s);
  if (text.length > STORAGE_LIMIT) {
    delete s.mis; // daily missions come back by themselves
    text = JSON.stringify(s);
  }
  return text.length > STORAGE_LIMIT ? '' : text;
}

/** The further save wins: more levels open, then more stars. Purchases are never lost. */
function isAhead(cloud, local) {
  if ((cloud.unlocked || 0) !== (local.unlocked || 0)) return (cloud.unlocked || 0) > (local.unlocked || 0);
  return totalStars(cloud) > totalStars(local);
}

let saveTimer = 0;
let syncing = false;
async function saveNow() {
  const data = login === 'connected' ? snapshot() : '';
  if (!data) return;
  try {
    await Bazaar.saveData({ data });
  } catch (e) {
    /* offline or Bazaar busy: the next change saves again */
  }
}
function scheduleSave() {
  if (login !== 'connected' || syncing) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, SAVE_DELAY);
}

async function sync() {
  syncing = true;
  try {
    const { data } = await Bazaar.loadData();
    const cloud = data ? JSON.parse(data) : null;
    if (cloud && isAhead(cloud, getState())) {
      LOCAL_ONLY.forEach((k) => delete cloud[k]);
      update({ ...cloud, adsRemoved: !!cloud.adsRemoved || getState().adsRemoved });
    } else {
      syncing = false;
      await saveNow();
    }
  } catch (e) {
    /* offline, or a save this version can't read: the local game goes on */
  } finally {
    syncing = false;
  }
}

/**
 * Bazaar is installed and new enough; otherwise opens Bazaar's own install / update screen.
 * Returns false when the player has to do that first.
 */
async function bazaarReady() {
  const { installed, needsUpdate } = await Bazaar.status();
  if (!installed) await Bazaar.showInstallBazaar();
  else if (needsUpdate) await Bazaar.showUpdateBazaar();
  return installed && !needsUpdate;
}

/** Resolves 'connected', 'cancelled', 'needsBazaar', 'needsLogin' (Bazaar's login page was opened) or 'failed'. */
export async function signInWithBazaar() {
  if (!bazaarAppAvailable() || login === 'working') return 'failed';
  setLogin('working');
  try {
    if (!(await bazaarReady())) {
      setLogin('signedOut');
      return 'needsBazaar';
    }
    const { loggedIn } = await Bazaar.isLoggedIn();
    if (loggedIn === false) {
      setLogin('signedOut');
      await Bazaar.open({ page: 'login' });
      return 'needsLogin';
    }
    const { accountId } = await Bazaar.signIn();
    if (!accountId) {
      setLogin('signedOut');
      return 'cancelled';
    }
    storage((s) => s.removeItem(OFF_KEY));
    setLogin('connected');
    await sync();
    return 'connected';
  } catch (e) {
    setLogin('signedOut');
    return 'failed';
  }
}

/** Bazaar keeps the account on the phone, so the game just stops saving there and signing in by itself. */
export function signOutOfBazaar() {
  clearTimeout(saveTimer);
  storage((s) => s.setItem(OFF_KEY, '1'));
  setLogin('signedOut');
}

/** Once at start: signs a returning player in without asking and keeps the Bazaar save up to date. */
export async function startBazaarApp() {
  if (!bazaarAppAvailable()) return;
  subscribe(scheduleSave);
  if (storage((s) => s.getItem(OFF_KEY) === '1', false)) return;
  try {
    const { installed, needsUpdate } = await Bazaar.status();
    if (!installed || needsUpdate) return;
    const { accountId } = await Bazaar.account();
    if (!accountId) return;
    setLogin('connected');
    await sync();
  } catch (e) {
    /* Bazaar not reachable: the player can sign in from the settings */
  }
}

// ---- Bazaar's pages
export const rateOnBazaar = () => Bazaar.open({ page: 'review' }).catch(() => {});
export const openMoreGames = () => Bazaar.open({ page: 'developer', developerId: DEVELOPER_ID }).catch(() => {});

// ---- updates
export const updateFromBazaar = () => Bazaar.update().catch(() => {});

/** The new version code when Bazaar has one the player did not put off, else null. Never throws. */
export async function pendingBazaarUpdate() {
  if (!bazaarAppAvailable()) return null;
  try {
    const { state, versionCode } = await Bazaar.updateState();
    if (state !== 'needUpdate') return null;
    return storage((s) => s.getItem(LATER_KEY), null) === String(versionCode) ? null : versionCode;
  } catch (e) {
    return null;
  }
}
export const putOffBazaarUpdate = (versionCode) => storage((s) => s.setItem(LATER_KEY, String(versionCode)));

export const bazaarAutoUpdate = () =>
  Bazaar.autoUpdateState().then(
    (r) => r.state,
    () => 'unsupported',
  );
export const enableBazaarAutoUpdate = () => Bazaar.enableAutoUpdate().catch(() => {});

/** Asks once at start when Bazaar has a newer version. */
export function useBazaarUpdate() {
  const [versionCode, setVersionCode] = useState(null);
  useEffect(() => {
    pendingBazaarUpdate().then(setVersionCode);
  }, []);
  return [versionCode, () => setVersionCode(null)];
}
