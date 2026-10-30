import { useSave, totalStars } from '../store.js';
import { useT } from '../i18n.js';
import { levelCount, getLevel } from '../game/levels.js';
import { sfx } from '../audio.js';

export function Stars({ n, size = 16 }) {
  return (
    <span className="stars" style={{ fontSize: size }}>
      {[1, 2, 3].map((i) => (
        <svg key={i} viewBox="0 0 24 24" width={size} height={size} className={i <= n ? 'on' : 'off'}>
          <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 16.9 5.9 20.4l1.5-6.8L2.2 9l6.9-.7z" />
        </svg>
      ))}
    </span>
  );
}

export default function LevelSelect({ onBack, onPick }) {
  const save = useSave();
  const t = useT();
  const palette = ['#7ddc8a', '#4dabf7', '#ffa94d', '#f783ac'];
  return (
    <main className="screen levels">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label={t('back')}>
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <h2>{t('levels')}</h2>
        <span className="chip">
          ★ {t.n(totalStars(save))}/{t.n(levelCount * 3)}
        </span>
      </header>
      <div className="level-grid">
        {Array.from({ length: levelCount }, (_, i) => {
          const n = i + 1;
          const locked = n > save.unlocked;
          const lv = getLevel(n);
          return (
            <button
              key={n}
              className={'level-tile' + (locked ? ' locked' : '')}
              style={{ '--tile': palette[lv.difficulty] }}
              disabled={locked}
              onClick={() => {
                sfx.click();
                onPick(n);
              }}
            >
              {locked ? (
                <svg viewBox="0 0 24 24" width="30" height="30" className="lock">
                  <path d="M7 10V8a5 5 0 0110 0v2h1a1 1 0 011 1v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9a1 1 0 011-1zm2 0h6V8a3 3 0 00-6 0z" />
                </svg>
              ) : (
                <>
                  <b>{t.n(n)}</b>
                  <Stars n={save.stars[n] || 0} size={15} />
                </>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );
}
