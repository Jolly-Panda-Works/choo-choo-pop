import { APP_VERSION, VERSION_URL } from './config.js';

const cmp = (a, b) => {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
};

/** Optional online check. Never throws; resolves to null when offline / disabled. */
export async function checkForUpdate() {
  if (VERSION_URL.includes('OWNER/REPO')) return null;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 4000);
  try {
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { signal: ctl.signal, cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.version && cmp(data.version, APP_VERSION) > 0 ? data : null;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function openExternal(url) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
      return;
    }
  } catch (e) {
    /* fall through */
  }
  window.open(url, '_blank', 'noopener');
}
