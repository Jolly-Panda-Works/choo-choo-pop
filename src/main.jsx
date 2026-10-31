import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './anim/ua.js';

async function start() {
  if (import.meta.env.VITE_EDITION === 'fa') {
    // bundled font: the game works offline and every phone shows the same Persian letters/digits
    // (Merkin and Cabin have no Arabic letters, so Persian text and digits come from Vazirmatn)
    await import('@fontsource-variable/vazirmatn/wght.css');
  }
  try {
    const loads = [document.fonts.load('400 64px "Merkin"'), document.fonts.load('700 18px "Cabin"')];
    if (import.meta.env.VITE_EDITION === 'fa') loads.push(document.fonts.load('900 64px "Vazirmatn Variable"'), document.fonts.load('700 18px "Vazirmatn Variable"'));
    await Promise.all(loads);
  } catch (e) {
    /* fall back to the system font */
  }
  createRoot(document.getElementById('root')).render(<App />);
}
start();
