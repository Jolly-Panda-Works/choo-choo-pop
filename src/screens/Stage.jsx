import { useEffect, useMemo, useRef } from 'react';
import { useSave, starsInRange } from '../store.js';
import { useT } from '../i18n.js';
import { STAGES, stageLevels } from '../game/stages.js';
import { difficultyOf, nodeKind } from '../game/levels.js';
import { STAGE_SIZE } from '../config.js';
import { ART } from '../board/sprites.js';
import { sfx } from '../audio.js';
import Panda from '../ui/Panda.jsx';
import { Stars, BackIcon, Coin } from '../ui/icons.jsx';

const COLS = 4;
const ROW_H = 128;
const TOP_PAD = 120;
const BOTTOM_PAD = 90;
const XS = [13, 37.5, 62.5, 87]; // percent

/** Position of station i (0-based): the path snakes upwards, 4 per row. */
function place(i, rows) {
  const row = Math.floor(i / COLS);
  const k = i % COLS;
  const col = row % 2 === 0 ? k : COLS - 1 - k;
  const wave = Math.sin(i * 1.3) * 12;
  return { x: XS[col], y: TOP_PAD + (rows - 1 - row) * ROW_H + wave };
}

const Crown = () => (
  <svg className="crown" viewBox="0 0 32 22" width="30" height="21" aria-hidden="true">
    <path d="M3 19 L1 5 L10 11 L16 2 L22 11 L31 5 L29 19 Z" fill="#ffd43b" stroke="#c48a00" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="16" cy="12" r="2.2" fill="#e64980" />
  </svg>
);

export default function Stage({ stageId, onBack, onPick, onShop }) {
  const save = useSave();
  const t = useT();
  const st = STAGES[stageId - 1];
  const levels = useMemo(() => stageLevels(stageId), [stageId]);
  const rows = Math.ceil(STAGE_SIZE / COLS);
  const H = TOP_PAD + rows * ROW_H + BOTTOM_PAD - 40;
  const pts = levels.map((_, i) => place(i, rows));
  const scroller = useRef(null);
  const current = Math.min(Math.max(save.unlocked, st.first), st.last);

  // start with the current station in the middle of the screen
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const p = pts[current - st.first];
    el.scrollTop = Math.max(0, p.y - el.clientHeight / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId]);

  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const got = starsInRange(save, st.first, st.last);

  return (
    <main className="screen stage">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label={t('back')}>
          <BackIcon />
        </button>
        <div className="title-block">
          <h2>{t(st.nameKey)}</h2>
          <span className="chip small-chip">
            ★ {t.n(got)}/{t.n(STAGE_SIZE * 3)}
          </span>
        </div>
        <button className="chip coin-chip" onClick={onShop} aria-label={t('shop')}>
          <Coin size={20} /> {t.n(save.coins)}
        </button>
      </header>

      <div className="stage-scroll" ref={scroller}>
        <div className="stage-board" style={{ height: H }}>
          <svg className="stage-track" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={d} className="mt-ground" />
            <path d={d} className="mt-sleepers" />
            <path d={d} className="mt-rail" />
          </svg>
          <img className="deco d1" src={`${ART}deco/tree.png`} alt="" draggable="false" />
          <img className="deco d2" src={`${ART}deco/bush.png`} alt="" draggable="false" />
          <img className="deco d3" src={`${ART}deco/tree.png`} alt="" draggable="false" />
          <img className="deco d4" src={`${ART}deco/flower.png`} alt="" draggable="false" />
          {levels.map((n, i) => {
            const kind = nodeKind(difficultyOf(n));
            const locked = n > save.unlocked;
            const here = n === save.unlocked && n <= st.last && !save.stars[n];
            const s = save.stars[n] || 0;
            return (
              <button
                key={n}
                className={`node k-${kind}${locked ? ' locked' : s ? ' passed' : ''}${here ? ' current' : ''}`}
                style={{ left: pts[i].x + '%', top: pts[i].y + 'px' }}
                disabled={locked}
                onClick={() => {
                  sfx.click();
                  onPick(n);
                }}
                aria-label={`${t('station')} ${i + 1}`}
              >
                {kind === 'super' && <Crown />}
                {s > 0 && !locked && <Stars n={s} size={22} className="node-stars" />}
                {here && <Panda pose="wave" skin={save.pandaSkin} size={44} className="node-panda" />}
                <span className="stone">
                  {locked ? <img src={`${ART}ui/lock.png`} width="30" height="30" alt="" draggable="false" /> : <b>{t.n(i + 1)}</b>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
