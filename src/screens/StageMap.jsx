import { useState } from 'react';
import { useSave, starsInRange } from '../store.js';
import { useT } from '../i18n.js';
import { STAGES, stageBuilt } from '../game/stages.js';
import { STAGE_SIZE } from '../config.js';
import { sfx } from '../audio.js';
import Panda from '../ui/Panda.jsx';
import Modal from '../ui/Modal.jsx';
import { BackIcon, Coin } from '../ui/icons.jsx';

// Where each stage sits on the map (percent of width / height). The map reads bottom -> top.
const POS = [
  [27, 79],
  [71, 58],
  [29, 37],
  [69, 16],
];
const TRACK = 'M27 79 C58 86 92 72 71 58 C50 44 8 52 29 37 C50 22 90 32 69 16';

/** Tiny top-down-ish illustrations (placeholders until the final stage art is delivered, see docs/ART_ASSETS_V2.md). */
function StageIcon({ id }) {
  const house = (x, y, roof, w = 26) => (
    <g key={x + ':' + y}>
      <rect x={x} y={y} width={w} height={w * 0.8} rx="4" fill="#fff4dc" stroke="#b9895a" strokeWidth="2" />
      <path d={`M${x - 4} ${y + 3} L${x + w / 2} ${y - w * 0.42} L${x + w + 4} ${y + 3} Z`} fill={roof} stroke="#7a3b2a" strokeWidth="2" strokeLinejoin="round" />
      <rect x={x + w / 2 - 4} y={y + w * 0.3} width="8" height={w * 0.5} rx="2" fill="#a56b3d" />
    </g>
  );
  const tree = (x, y, s = 1) => (
    <g key={'t' + x + y} transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-2.5" y="6" width="5" height="9" fill="#8a5a33" />
      <circle cx="0" cy="2" r="10" fill="#3fa84f" stroke="#2b7d3a" strokeWidth="2" />
    </g>
  );
  return (
    <svg viewBox="0 0 120 100" className="stage-ico" aria-hidden="true">
      <ellipse cx="60" cy="88" rx="52" ry="9" fill="rgba(0,0,0,.18)" />
      {id === 1 && (
        <>
          {tree(14, 70)}
          {house(24, 52, '#e4584a')}
          {house(62, 58, '#f2a33a', 22)}
          {tree(100, 66, 0.9)}
        </>
      )}
      {id === 2 && (
        <>
          <ellipse cx="60" cy="74" rx="40" ry="14" fill="#5bb8f5" stroke="#2f86d1" strokeWidth="3" />
          {house(14, 38, '#4a7ad8', 24)}
          {house(80, 40, '#e4584a', 24)}
          {tree(56, 38, 0.9)}
        </>
      )}
      {id === 3 && (
        <>
          <path d="M6 84 L40 22 L66 64 L82 40 L114 84 Z" fill="#9aa7c4" stroke="#6b7898" strokeWidth="3" strokeLinejoin="round" />
          <path d="M40 22 L52 44 L40 40 L30 46 Z" fill="#fff" />
          <path d="M82 40 L92 58 L82 54 L74 60 Z" fill="#fff" />
          {house(48, 66, '#c0462f', 20)}
        </>
      )}
      {id === 4 && (
        <>
          {[
            [14, 40, 22, 44, '#7e8fb8'],
            [40, 22, 24, 62, '#5f73a3'],
            [68, 34, 22, 50, '#8d9cc4'],
            [92, 46, 18, 38, '#6f82ae'],
          ].map(([x, y, w, h, c]) => (
            <g key={x}>
              <rect x={x} y={y} width={w} height={h} rx="3" fill={c} stroke="#44527a" strokeWidth="2" />
              {[0, 1, 2, 3].map((r) => (
                <rect key={r} x={x + 4} y={y + 6 + r * 12} width={w - 8} height="5" rx="1.5" fill="#ffe27a" opacity=".9" />
              ))}
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

export default function StageMap({ onBack, onOpen, onShop }) {
  const save = useSave();
  const t = useT();
  const [msg, setMsg] = useState(null);
  const currentStage = Math.min(STAGES.length, Math.ceil(Math.min(save.unlocked, STAGES.length * STAGE_SIZE) / STAGE_SIZE));

  const tap = (st) => {
    sfx.click();
    const open = save.unlocked >= st.first;
    if (!stageBuilt(st.id)) setMsg('soon');
    else if (!open) setMsg('locked');
    else onOpen(st.id);
  };

  return (
    <main className="screen map">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label={t('back')}>
          <BackIcon />
        </button>
        <h2>{t('map')}</h2>
        <button className="chip coin-chip" onClick={onShop} aria-label={t('shop')}>
          <Coin size={20} /> {t.n(save.coins)}
        </button>
      </header>

      <div className="map-art">
        <div className="river" />
        <div className="pond" />
        <svg className="map-track" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={TRACK} className="mt-ground" />
          <path d={TRACK} className="mt-sleepers" />
          <path d={TRACK} className="mt-rail" />
        </svg>
        {STAGES.map((st, i) => {
          const built = stageBuilt(st.id);
          const open = built && save.unlocked >= st.first;
          const got = starsInRange(save, st.first, st.last);
          return (
            <button
              key={st.id}
              className={'stage-node' + (open ? '' : ' locked') + (st.id === currentStage && open ? ' current' : '')}
              style={{ left: POS[i][0] + '%', top: POS[i][1] + '%' }}
              onClick={() => tap(st)}
            >
              <StageIcon id={st.id} />
              {st.id === currentStage && open && <Panda pose="wave" skin={save.pandaSkin} size={46} className="stage-panda" />}
              {!open && (
                <i className="stage-lock">
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path d="M7 10V8a5 5 0 0110 0v2h1a1 1 0 011 1v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9a1 1 0 011-1zm2 0h6V8a3 3 0 00-6 0z" />
                  </svg>
                </i>
              )}
              <span className="ribbon">
                <b>{t(st.nameKey)}</b>
                <small>{built ? `★ ${t.n(got)}/${t.n(STAGE_SIZE * 3)}` : t('soon')}</small>
              </span>
            </button>
          );
        })}
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
