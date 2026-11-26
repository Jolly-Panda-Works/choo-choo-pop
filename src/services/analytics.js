import { Capacitor, registerPlugin } from '@capacitor/core';
import { APP_VERSION, IS_WEB_DEMO, MOCK_SERVICES } from '../config.js';

let client;
let language;
export function startAnalytics(readLanguage) {
  language = readLanguage;
  if (MOCK_SERVICES) return;
  if (Capacitor.isNativePlatform()) {
    if (Capacitor.isPluginAvailable('MetrixEvents')) {
      const native = registerPlugin('MetrixEvents');
      client = Promise.resolve({ event: args => native.event(args), revenue: args => native.revenue(args) });
    }
  } else {
    const { VITE_METRIX_APP_ID: id, VITE_METRIX_API_KEY: key } = import.meta.env;
    if (!id || !key) return;
    client = import('@metrixorg/websdk').then(sdk => {
      sdk.init(id, key, { sessionTracking: { enabled: true, packageName: 'choochoopop' } });
      return { event: ({ name, attributes }) => sdk.newEventByName(name, attributes) };
    }).catch(() => null);
  }
}

export function track(name, fields = {}) {
  if (!client) return;
  const attributes = { app_version: APP_VERSION, channel: IS_WEB_DEMO ? 'web' : __STORE__,
    edition: IS_WEB_DEMO ? 'demo' : 'full', language: language(), ...fields };
  client.then(sdk => sdk?.event({ name, attributes })).catch(() => {});
}

export function revenue(amount) {
  if (amount > 0) client?.then(sdk => sdk?.revenue?.({ amount })).catch(() => {});
}

let screen;
let entry;
export function screenViewed(next) {
  if (next === screen) return;
  entry = screen;
  track('screen_viewed', { screen: next, previous_screen: screen || 'launch' });
  screen = next;
}

let played = false;
let hiddenAt;
export function sessionVisibility() {
  if (document.hidden) hiddenAt = Date.now();
  else if (hiddenAt && Date.now() - hiddenAt >= 30 * 60_000) played = false;
}

export function firstPlay(level, restored) {
  if (played) return;
  played = true;
  track('game_started', { level_id: level, is_saved_game: restored, entry_point: (screen === 'game' ? entry : screen) || 'launch' });
}
