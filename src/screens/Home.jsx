import { useT } from '../i18n.js';
import { sfx } from '../audio.js';
import { APP_VERSION } from '../config.js';
import { useSave } from '../store.js';
import { Coin } from '../ui/icons.jsx';
import logo from '../assets/logo.webp';

export default function Home({ onPlay, onMap, onShop, onSettings, hasProgress }) {
  const t = useT();
  const save = useSave();
  const words = t('title').split(' ');
  const last = words.pop();
  const go = (fn) => () => {
    sfx.click();
    fn();
  };
  return (
    <main className="screen home">
      <button className="chip coin-chip home-coins" onClick={go(onShop)} aria-label={t('shop')}>
        <Coin size={20} /> {t.n(save.coins)}
      </button>
      <div className="home-top">
        <img className="logo-img bob" src={logo} alt="" draggable="false" />
        <h1 className="game-title">
          {words.map((w, i) => (
            <span key={i}>{w} </span>
          ))}
          <span className="pop">{last}</span>
        </h1>
      </div>
      <div className="home-actions">
        <button className="btn big yellow" onClick={go(onPlay)}>
          {hasProgress ? t('continue') : t('play')}
        </button>
        <button className="btn big blue" onClick={go(onMap)}>
          {t('map')}
        </button>
        <div className="btn-row">
          <button className="btn" onClick={go(onShop)}>
            {t('shop')}
          </button>
          <button className="btn" onClick={go(onSettings)}>
            {t('settings')}
          </button>
        </div>
      </div>
      <p className="ver">
        {t('version')} {t.n(APP_VERSION)}
      </p>
    </main>
  );
}
