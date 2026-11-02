import { useState } from 'react';
import { useT } from '../i18n.js';
import { ART } from '../board/sprites.js';
import { sfx } from '../audio.js';
import { STORY } from '../game/story.js';

// Opening story, shown the first time the game starts (and from Settings): a comic, panel by panel (game/story.js).

export default function Story({ onDone }) {
  const t = useT();
  const [page, setPage] = useState(0);
  const [shown, setShown] = useState(1);
  const panels = STORY[page].panels;
  const lastPanel = shown === panels.length;
  const end = lastPanel && page === STORY.length - 1;
  const next = () => {
    sfx.click();
    if (end) onDone();
    else if (lastPanel) {
      setPage(page + 1);
      setShown(1);
    } else setShown(shown + 1);
  };

  return (
    <main className="screen story">
      <button className="skip" onClick={onDone}>
        {t('skip')}
      </button>
      <div className="comic" key={page} onClick={next}>
        {panels.slice(0, shown).map((p) => {
          const [x, y, w, h] = p.box;
          const { key, kind, tail, ...at } = p.text;
          return (
            <div key={key} className="sp" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}>
              <img className="sp-bg" src={ART + p.art} alt="" draggable="false" />
              <div className={`sp-text sp-${kind}` + (tail ? ` tail-${tail}` : '')} style={{ left: `${at.x}%`, width: `${at.w}%`, ...(at.b != null ? { bottom: `${at.b}%` } : { top: `${at.y}%` }) }}>
                {t(key)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="dots">
        {STORY.map((_, k) => (
          <i key={k} className={k === page ? 'on' : ''} />
        ))}
      </div>
      <button className="btn big yellow story-next" onClick={next}>
        {end ? t('letsGo') : t('next2')}
      </button>
    </main>
  );
}
