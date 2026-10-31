import { useEffect, useRef, useState } from 'react';
import { useSave, starsInRange } from '../store.js';
import { useT } from '../i18n.js';
import { STAGES, stageBuilt } from '../game/stages.js';
import { STAGE_THEMES, TILE, stackHeight } from '../game/mapTheme.js';
import { STAGE_SIZE } from '../config.js';
import { MAP_ART } from '../board/sprites.js';
import { sfx } from '../audio.js';
import Panda from '../ui/Panda.jsx';
import Modal from '../ui/Modal.jsx';
import { BackButton, Coin } from '../ui/icons.jsx';
import { TileStack, SeaDecor, smoothPath, useWidth } from '../ui/MapKit.jsx';
import { ua, uaDelay } from '../anim/ua.js';

// World map: one island tile per stage, stacked bottom -> top (stage 1 = the start island).
// [x percent, position inside its tile (0 = top, 1 = bottom)]
const WORLD = ['green-start', 'desert-1', 'ice-1', 'candy-1', 'end'];
const ANCHOR = [
  [54, 0.76],
  [38, 0.72],
  [60, 0.8],
  [42, 0.62],
];

export default function StageMap({ onBack, onOpen, onShop }) {
  const save = useSave();
  const t = useT();
  const [msg, setMsg] = useState(null);
  const scroller = useRef(null);
  const board = useRef(null);
  const W = useWidth(board);
  const H = stackHeight(WORLD) * W;
  const currentStage = Math.min(STAGES.length, Math.ceil(Math.min(save.unlocked, STAGES.length * STAGE_SIZE) / STAGE_SIZE));

  // top y (in widths) of each tile, tiles are drawn top -> bottom in reverse order
  const tops = {};
  let acc = 0;
  [...WORLD].reverse().forEach((n) => {
    tops[n] = acc;
    acc += TILE[n];
  });
  const pts = ANCHOR.map(([x, f], i) => {
    const n = WORLD[i];
    return [(x / 100) * W, (tops[n] + f * TILE[n]) * W];
  });

  useEffect(() => {
    const el = scroller.current;
    if (!el || !W) return;
    el.scrollTop = Math.max(0, pts[currentStage - 1][1] - el.clientHeight / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W > 0]);

  const tap = (st) => {
    sfx.click();
    const open = save.unlocked >= st.first;
    if (!stageBuilt(st.id)) setMsg('soon');
    else if (!open) setMsg('locked');
    else onOpen(st.id);
  };
  const size = Math.max(96, Math.min(150, W * 0.3));

  return (
    <main className="screen map">
      <header className="topbar">
        <BackButton onClick={onBack} label={t('back')} />
        <h2>{t('map')}</h2>
        <button className="chip coin-chip" onClick={onShop} aria-label={t('shop')}>
          <Coin size={22} /> {t.n(save.coins)}
        </button>
      </header>

      <div className="stage-scroll" ref={scroller}>
        <div className="stage-board" ref={board} style={{ height: W ? H : undefined }}>
          <TileStack tiles={WORLD} />
          <SeaDecor />
          {W > 0 && (
            <svg className="stage-track" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
              <path d={smoothPath(pts)} className="trail-base" />
            </svg>
          )}
          {W > 0 &&
            STAGES.map((st, i) => {
              const built = stageBuilt(st.id);
              const open = built && save.unlocked >= st.first;
              const got = starsInRange(save, st.first, st.last);
              const here = st.id === currentStage && open;
              return (
                <button
                  key={st.id}
                  className={'stage-node' + (open ? '' : ' locked') + (here ? ' current' : '')}
                  style={{ left: pts[i][0], top: pts[i][1], width: size }}
                  onClick={() => tap(st)}
                >
                  {here && <i className={'node-shine ' + ua('level-scene-shine-shine-idle')} />}
                  {here && <Panda pose="wave" skin={save.pandaSkin} size={Math.round(size * 0.78)} className={'stage-panda ' + ua('home-scene-portrait-animals-panda-panda-idle')} />}
                  <span className={'node-face ' + ua('buttons-bubbles-enter' + (i + 1))} style={{ width: size, height: size * 0.97, ...uaDelay(0.1 + i * 0.12) }}>
                    <img className="node-btn" src={`${MAP_ART}ui/btn-${open ? STAGE_THEMES[i].btn : 'greykeyhole'}.webp`} alt="" draggable="false" />
                    {open && <b className="node-n big">{t.n(st.id)}</b>}
                  </span>
                  <span className="ribbon">
                    <b>{t(st.nameKey)}</b>
                    <small>{built ? `★ ${t.n(got)}/${t.n(STAGE_SIZE * 3)}` : t('soon')}</small>
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {msg && (
        <Modal pose={msg === 'soon' ? 'ticket' : 'salute'} title={t(msg === 'soon' ? 'soonTitle' : 'lockedTitle')} onClose={() => setMsg(null)}>
          <p className="goal">{t(msg === 'soon' ? 'soonText' : 'lockedText')}</p>
          <div className="modal-actions">
            <button className="btn big yellow" onClick={() => setMsg(null)}>
              OK
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
