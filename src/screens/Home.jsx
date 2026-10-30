import { useT } from '../i18n.js';
import { sfx } from '../audio.js';
import { APP_VERSION } from '../config.js';

function Logo() {
  return (
    <svg className="logo-train" viewBox="0 0 220 120" role="img" aria-label="train">
      <rect x="8" y="98" width="204" height="8" rx="4" fill="#a9693a" />
      <g className="bob">
        <rect x="18" y="52" width="70" height="42" rx="10" fill="#4dabf7" />
        <rect x="94" y="52" width="70" height="42" rx="10" fill="#ffd43b" />
        <rect x="26" y="60" width="54" height="10" rx="5" fill="#fff" opacity=".85" />
        <rect x="102" y="60" width="54" height="10" rx="5" fill="#fff" opacity=".85" />
        <rect x="170" y="40" width="42" height="54" rx="12" fill="#ff6b6b" />
        <rect x="178" y="22" width="14" height="22" rx="4" fill="#ffd43b" />
        <circle cx="188" cy="62" r="7" fill="#fff" />
        <circle cx="190" cy="62" r="3" fill="#222" />
        <circle cx="204" cy="62" r="7" fill="#fff" />
        <circle cx="206" cy="62" r="3" fill="#222" />
        {[44, 70, 120, 146, 186, 206].map((x) => (
          <circle key={x} cx={x} cy="98" r="9" fill="#3b3b4f" stroke="#fff" strokeWidth="3" />
        ))}
        <circle className="puff p1" cx="186" cy="14" r="7" fill="#fff" />
        <circle className="puff p2" cx="196" cy="6" r="5" fill="#fff" />
      </g>
    </svg>
  );
}

export default function Home({ onPlay, onLevels, onSettings, hasProgress }) {
  const t = useT();
  return (
    <main className="screen home">
      <div className="home-top">
        <Logo />
        <h1 className="game-title">
          <span>Choo</span> <span>Choo</span> <span className="pop">Pop</span>
        </h1>
        {t.lang === 'fa' && <p className="fa-sub">{t('title')}</p>}
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
        {t('version')} {APP_VERSION} · {t('offline')}
      </p>
    </main>
  );
}
