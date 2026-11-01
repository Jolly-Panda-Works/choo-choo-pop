import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './anim/ua.js';
import { registerBillingProvider, billing } from './services/billing.js';
import { bazaarProvider, bazaarSupported } from './services/bazaar.js';
import { startBazaarApp } from './services/bazaarApp.js';
import { STORE } from './config.js';

async function start() {
  // Cafe Bazaar build on Android: in-app billing (needs VITE_BAZAAR_RSA_KEY, see .env.example)
  if (STORE === 'bazaar' && bazaarSupported()) {
    registerBillingProvider(bazaarProvider);
    billing.recover(); // finish purchases interrupted last time
  }
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
  createRoot(document.getElementById('root')).render(<App />);
  startBazaarApp();
}
start();
