import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import DemoApp from './demo/DemoApp.jsx';
import { IS_WEB_DEMO } from './config.js';
import './styles.css';
import './anim/ua.js';
import { startPlatform } from './services/platform.jsx';
import { loadSounds, setupMusic } from './audio.js';

import { currentLang } from './store.js';
import { startAnalytics, sessionVisibility } from './services/analytics.js';

async function start() {
  startAnalytics(currentLang);
  document.addEventListener('visibilitychange', sessionVisibility);
  if (!IS_WEB_DEMO) startPlatform();
  loadSounds();
  setupMusic();
  // bundled font: the game works offline and every phone shows the same Persian letters/digits
  // (Merkin and Cabin have no Arabic letters, so Persian text and digits come from Vazirmatn)
  await import('@fontsource-variable/vazirmatn/wght.css');
  try {
    await Promise.all([
      document.fonts.load('400 64px "Merkin"'),
      document.fonts.load('700 18px "Cabin"'),
      document.fonts.load('900 64px "Vazirmatn Variable"'),
      document.fonts.load('700 18px "Vazirmatn Variable"'),
    ]);
  } catch (e) {
    /* fall back to the system font */
  }
  createRoot(document.getElementById('root')).render(IS_WEB_DEMO ? <DemoApp /> : <App />);
}
start();
