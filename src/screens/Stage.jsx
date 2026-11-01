import { useSave, starsInRange } from '../store.js';
import { useT } from '../i18n.js';
import { STAGES, stageLevels, stageBuilt } from '../game/stages.js';
import { difficultyOf, nodeKind } from '../game/levels.js';
import { NODE_BTN } from '../game/mapTheme.js';
import { STAGE_SIZE } from '../config.js';
import { MAP_ART, UI_ART } from '../board/sprites.js';
import { sfx } from '../audio.js';
import { usePandaSrc } from '../ui/Panda.jsx';
import { BackButton, Coin } from '../ui/icons.jsx';
import { Crown } from '../ui/MapKit.jsx';
import { ua, uaDelay } from '../anim/ua.js';

// Levels (stations) of one stage as a clean grid of glossy bubbles with their stars underneath:
//   passed  -> coloured by difficulty + gold stars
//   current -> same, with the panda marker above it and a pulsing shine
//   next    -> grey bubble with a padlock
//   later   -> frosted bubble with a padlock
// This screen deliberately does NOT use the island map art - that belongs to the stage map (StageMap.jsx).

const Lock = () => (
  <svg className="lv-lock" viewBox="0 0 24 28" width="26" height="30" aria-hidden="true">
    <path d="M6.5 11V8.5a5.5 5.5 0 0111 0V11" fill="none" stroke="#7d8a93" strokeWidth="3.2" strokeLinecap="round" />
    <rect x="3" y="10.5" width="18" height="15" rx="4.5" fill="#fff" stroke="#c9d3d9" strokeWidth="1.2" />
    <circle cx="12" cy="17" r="2.2" fill="#8795a0" />
    <path d="M12 18v3.4" stroke="#8795a0" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

function Marker({ skin }) {
  const src = usePandaSrc('wave', skin);
  return (
    <span className="lv-marker" aria-hidden="true">
      <span className={'lv-marker-face ' + ua('home-scene-portrait-animals-panda-panda-idle')}>
        <span className="lv-marker-clip">
          <img src={src} alt="" draggable="false" />
        </span>
      </span>
    </span>
  );
}

function Stars3({ n }) {
  return (
    <span className="lv-stars" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <img key={i} src={`${MAP_ART}ui/star-${i <= n ? 'gold' : 'grey'}.webp`} alt="" draggable="false" />
      ))}
    </span>
  );
}

export default function Stage({ stageId, onBack, onPick, onShop, onStage }) {
  const save = useSave();
  const t = useT();
  const st = STAGES[stageId - 1];
  const levels = stageLevels(stageId);
  const got = starsInRange(save, st.first, st.last);
  const prev = stageId > 1 ? stageId - 1 : null;
  // the next stage can be opened with the arrow only when it exists (all its levels are built)
  const next = stageId < STAGES.length && stageBuilt(stageId + 1) ? stageId + 1 : null;
  const go = (id) => () => {
    if (!id) return;
    sfx.click();
    onStage(id);
  };

  return (
    <main className="screen levels">
      <header className="topbar">
        <BackButton onClick={onBack} label={t('back')} />
        <span className="chip small-chip">
          <img className="chip-star" src={`${MAP_ART}ui/star-gold.webp`} alt="" draggable="false" /> {t.n(got)}/{t.n(STAGE_SIZE * 3)}
        </span>
        <button className="chip coin-chip" onClick={onShop} aria-label={t('shop')}>
          <Coin size={22} /> {t.n(save.coins)}
        </button>
      </header>

      <div className="pager">
        <button className="pager-arrow prev" disabled={!prev} onClick={go(prev)} aria-label={t('prevStage')}>
          <img src={`${UI_ART}arrow-left.webp`} alt="" draggable="false" />
        </button>
        <div className="pager-title">
          <h2>
            {t('stageWord')} {t.n(stageId)}/{t.n(STAGES.length)}
          </h2>
          <span className="pager-sub">{t(st.nameKey)}</span>
        </div>
        <button className="pager-arrow next" disabled={!next} onClick={go(next)} aria-label={t('nextStage')}>
          <img src={`${UI_ART}arrow-right.webp`} alt="" draggable="false" />
        </button>
      </div>

      <div className="lv-scroll">
        <div className="lv-grid">
          {levels.map((n, i) => {
            const kind = nodeKind(difficultyOf(n));
            const locked = n > save.unlocked;
            const nextLocked = n === save.unlocked + 1;
            const s = save.stars[n] || 0;
            const here = n === save.unlocked && !s;
            const art = locked ? (nextLocked ? 'btn-grey' : null) : 'btn-' + NODE_BTN[kind];
            return (
              <div key={n} className={`lv k-${kind}${locked ? ' locked' : ''}${here ? ' current' : ''}`}>
                <button
                  className={'lv-btn ' + ua('buttons-bubbles-enter' + ((i % 5) + 1))}
                  style={uaDelay(0.04 + i * 0.035)}
                  disabled={locked}
                  onClick={() => {
                    sfx.click();
                    onPick(n);
                  }}
                  aria-label={`${t('station')} ${i + 1}`}
                >
                  {here && <i className={'node-shine ' + ua('level-scene-shine-shine-idle')} />}
                  {here && <Marker skin={save.pandaSkin} />}
                  {kind === 'super' && !locked && <Crown />}
                  <img
                    className={'lv-art' + (art ? '' : ' bub')}
                    src={art ? `${MAP_ART}ui/${art}.webp` : `${UI_ART}level-bubble.webp`}
                    alt=""
                    draggable="false"
                  />
                  {!locked && <b className="lv-n">{t.n(i + 1)}</b>}
                  {locked && nextLocked && <b className="lv-n dim">{t.n(i + 1)}</b>}
                  {locked && <Lock />}
                </button>
                {locked ? <span className="lv-stars ghost" /> : <Stars3 n={s} />}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
