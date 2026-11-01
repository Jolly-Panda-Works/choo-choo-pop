import { useEffect, useRef, useState } from 'react';
import { useSave, starsInRange } from '../store.js';
import { useT } from '../i18n.js';
import { STAGES, stageBuilt } from '../game/stages.js';
import { CITIES, TILE, TILE_BTN, stackHeight } from '../game/mapTheme.js';
import { STAGE_SIZE } from '../config.js';
import { MAP_ART } from '../board/sprites.js';
import { sfx } from '../audio.js';
import Modal from '../ui/Modal.jsx';
import { BackButton, Coin } from '../ui/icons.jsx';
import { TileStack, SeaDecor, useWidth } from '../ui/MapKit.jsx';
import { ua, uaDelay } from '../anim/ua.js';

// World map: one island tile per stage, stacked bottom -> top (stage 1 = the start island).
// City spots (11 in total) live in game/mapTheme.js; the stages built so far take the first ones, the rest stay locked.
const WORLD = ['green-start', 'desert-1', 'ice-1', 'candy-1', 'end'];

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
  const pts = CITIES.map(({ tile, x, f }) => [(x / 100) * W, (tops[tile] + f * TILE[tile]) * W]);

  useEffect(() => {
    const el = scroller.current;
    if (!el || !W) return;
    el.scrollTop = Math.max(0, pts[currentStage - 1][1] - el.clientHeight / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W > 0]);

  // drag the map with the mouse / pen (touch scrolls natively); the scrollbar is hidden
  useEffect(() => {
    const el = scroller.current;
    if (!el) return undefined;
    let id = null, startY = 0, startTop = 0, lastY = 0, lastT = 0, v = 0, moved = false, raf = 0, swallow = false;
    const glide = () => {
      el.scrollTop += v * 16;
      v *= 0.94;
      if (Math.abs(v) > 0.02) raf = requestAnimationFrame(glide);
    };
    const down = (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      cancelAnimationFrame(raf);
      id = e.pointerId;
      startY = lastY = e.clientY;
      startTop = el.scrollTop;
      lastT = performance.now();
      v = 0;
      moved = false;
    };
    const move = (e) => {
      if (e.pointerId !== id) return;
      const dy = e.clientY - startY;
      if (!moved && Math.abs(dy) > 6) {
        moved = true;
        el.setPointerCapture(id);
        el.classList.add('dragging');
      }
      if (!moved) return;
      el.scrollTop = startTop - dy;
      const now = performance.now();
      v = 0.6 * ((lastY - e.clientY) / Math.max(1, now - lastT)) + 0.4 * v;
      lastY = e.clientY;
      lastT = now;
    };
    const up = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      el.classList.remove('dragging');
      if (moved) {
        swallow = true;
        setTimeout(() => (swallow = false), 0);
        if (performance.now() - lastT < 80) raf = requestAnimationFrame(glide);
      }
    };
    const click = (e) => {
      if (swallow) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', click, true);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('click', click, true);
    };
  }, []);

  const tap = (st) => {
    sfx.click();
    const open = save.unlocked >= st.first;
    if (!stageBuilt(st.id)) setMsg('soon');
    else if (!open) setMsg('locked');
    else onOpen(st.id);
  };
  // city spots on the same island are close together, so the buttons are sized to the circles marked on the art
  const size = Math.max(64, Math.min(100, W * 0.2));

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
          {W > 0 &&
            CITIES.map((c, i) => {
              const st = STAGES[i];
              const th = TILE_BTN[c.tile];
              const style = { left: pts[i][0], top: pts[i][1], width: size, '--c': th.ink, '--s': size + 'px', zIndex: 2 + CITIES.length - i };
              // spots without a built-in stage: just a locked button, no label, nothing to tap
              if (!st) {
                return (
                  <span key={'lock' + i} className="stage-node locked idle" style={style}>
                    <span className="node-face">
                      <img className="node-btn" src={`${MAP_ART}ui/btn-greykeyhole.webp`} alt="" draggable="false" />
                    </span>
                  </span>
                );
              }
              const built = stageBuilt(st.id);
              const open = built && save.unlocked >= st.first;
              const got = starsInRange(save, st.first, st.last);
              const here = st.id === currentStage && open;
              return (
                <button key={st.id} className={'stage-node' + (open ? '' : ' locked') + (here ? ' current' : '')} style={style} onClick={() => tap(st)}>
                  {here && <i className={'node-shine ' + ua('level-scene-shine-shine-idle')} />}
                  <span className={'node-face ' + ua('buttons-bubbles-enter' + Math.min(i + 1, 4))} style={{ width: size, height: size * 0.97, ...uaDelay(0.1 + i * 0.12) }}>
                    <img className="node-btn" src={`${MAP_ART}ui/btn-${open ? th.btn : 'greykeyhole'}.webp`} alt="" draggable="false" />
                    {open && <b className="node-n big">{t.n(st.id)}</b>}
                  </span>
                  {here && <img className="map-pin" src={`${MAP_ART}ui/pin-panda.webp`} alt="" draggable="false" style={{ width: size * 0.7 }} />}
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
