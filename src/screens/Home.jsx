import { useT } from '../i18n.js';
import { sfx } from '../audio.js';
import { APP_VERSION } from '../config.js';
import logo from '../assets/logo.webp';

export default function Home({ onPlay, onLevels, onSettings, hasProgress }) {
  const t = useT();
  const words = t('title').split(' ');
  const last = words.pop();
  return (
    <main className="screen home">
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
        <button
          className="btn big yellow"
          onClick={() => {
            sfx.click();
            onPlay();
          }}
        >
          {hasProgress ? t('continue') : t('play')}
        </button>
        <button
          className="btn big blue"
          onClick={() => {
            sfx.click();
            onLevels();
          }}
        >
          {t('levels')}
        </button>
        <button
          className="btn"
          onClick={() => {
            sfx.click();
            onSettings();
          }}
        >
          {t('settings')}
        </button>
      </div>
      <p className="ver">
        {t('version')} {t.n(APP_VERSION)} · {t('offline')}
      </p>
    </main>
  );
}
