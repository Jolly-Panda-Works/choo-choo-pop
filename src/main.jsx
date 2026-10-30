import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

async function start() {
  if (import.meta.env.VITE_EDITION === 'fa') {
    // bundled font: the game works offline and every phone shows the same Persian letters/digits
    await import('@fontsource-variable/vazirmatn/wght.css');
    try {
      await Promise.all([document.fonts.load('900 64px "Vazirmatn Variable"'), document.fonts.load('700 18px "Vazirmatn Variable"')]);
    } catch (e) {
      /* fall back to the system font */
    }
  }
  createRoot(document.getElementById('root')).render(<App />);
}
start();
