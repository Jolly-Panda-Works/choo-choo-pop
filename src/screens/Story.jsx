import { useState } from 'react';
import { useT } from '../i18n.js';
import { useSave } from '../store.js';
import { ART } from '../board/sprites.js';
import { sfx } from '../audio.js';
import { usePandaSrc } from '../ui/Panda.jsx';
import { STORY } from '../game/story.js';

// Opening story, shown the first time the game starts (and from Settings): a comic, panel by panel (game/story.js).

const place = ({ x, y, w, rot = 0, flip }) => ({
  left: `${x}%`,
  top: `${y}%`,
  width: `${w}%`,
  transform: `translate(-50%, -50%) rotate(${rot}deg) scaleX(${flip ? -1 : 1})`,
});

function ScenePanda({ item, skin }) {
  const src = usePandaSrc(item.panda, skin);
  return <img className="sp-item" src={src} alt="" draggable="false" style={place(item)} />;
}

function Scene({ panel, skin }) {
  if (panel.art) return <img className="sp-bg" src={ART + panel.art} alt="" draggable="false" />;
  const image = panel.bg?.includes('/');
  return (
    <>
      {image ? <img className="sp-bg" src={ART + panel.bg} alt="" draggable="false" /> : <div className={'sp-bg sp-' + panel.bg} style={panel.bg === 'grass' ? { backgroundImage: `url(${ART}tiles/grass-a.png)` } : undefined} />}
      {(panel.scene || []).map((item, i) => {
        if (item.panda) return <ScenePanda key={i} item={item} skin={skin} />;
        if (item.num)
          return (
            <span key={i} className="sp-item sp-num" style={place(item)}>
              {item.label}
            </span>
          );
        return <img key={i} className="sp-item" src={ART + item.src} alt="" draggable="false" style={place(item)} />;
      })}
    </>
  );
}

export default function Story({ onDone }) {
  const t = useT();
  const save = useSave();
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
              <Scene panel={{ ...p, scene: p.scene?.map((s) => (s.num ? { ...s, label: t.n(s.num) } : s)) }} skin={save.pandaSkin} />
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
