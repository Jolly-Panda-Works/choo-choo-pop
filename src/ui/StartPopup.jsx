import { useState } from 'react';
import { Popup, rect, fs } from './v5.jsx';
import { PowerIcon, Bulb } from './icons.jsx';
import { useT } from '../i18n.js';
import { useSave, markTaught } from '../store.js';
import Modal from './Modal.jsx';
import { ART } from '../board/sprites.js';
import { POWERUP_TEACH } from '../config.js';
import { sfx } from '../audio.js';

// the station frame, in its own pixels
const DW = 1145;
const DH = 1122;
const CENTER_X = 553; // the panel is not in the middle of the art
const STAR = 120;
const STAR_GAP = 121;
const STAR_Y = 440;
const SLOT_W = 140;
const SLOT_H = 125;
const SLOT_GAP = 30;
const SLOT_Y = 566;
const SLOTS = ['star', 'peek', 'hint'];

/** "Level #" popup shown before a station starts: name, stars, the boosters taught so far, Play and Back. */
export default function StartPopup({ levelNo, inStage, stars, tutorial, onPlay, onClose }) {
  const t = useT();
  const save = useSave();
  const [picks, setPicks] = useState([]);
  const [note, setNote] = useState('');
  // the first power-up due here that the player has not been taught yet
  const lesson = Object.keys(POWERUP_TEACH).find((id) => levelNo >= POWERUP_TEACH[id] && !save.taught[id]);
  const toggle = (id, ok, count) => {
    sfx.click();
    if (!ok) return setNote(t('boosterLocked'));
    if (count <= 0) return setNote(t('noPower'));
    setNote('');
    setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };
  const slotCount = (id) => (id === 'hint' ? save.hints : save.powerups[id] || 0);
  const firstX = CENTER_X - (SLOTS.length * SLOT_W + (SLOTS.length - 1) * SLOT_GAP) / 2;
  return (
    <>
      <Popup dw={DW} dh={DH} o={[0, 0]} bg="station-frame">
        <div className="ptxt" style={{ ...rect(CENTER_X - 356, 344, 712, 90), ...fs(66), color: '#1f5662' }}>
          {t('station')} {t.n(inStage)}
        </div>
        {[0, 1, 2].map((i) => (
          <img key={i} className="v5pic" alt="" draggable="false" src={`${ART}map/ui/star-${i < stars ? 'gold' : 'grey'}.webp`} style={{ ...rect(CENTER_X - STAR / 2 + (i - 1) * STAR_GAP, STAR_Y - (i === 1 ? 10 : 0), STAR, STAR * 0.95), objectFit: 'contain' }} />
        ))}
        {SLOTS.map((id, i) => {
          // locked until taught: hints after the tutorial, power-ups by their lesson
          const ok = id === 'hint' ? !tutorial : !!save.taught[id];
          const on = picks.includes(id);
          return (
            <button key={id} className={'slotbtn' + (ok && slotCount(id) <= 0 ? ' empty' : '')} style={rect(firstX + i * (SLOT_W + SLOT_GAP), SLOT_Y, SLOT_W, SLOT_H)} onClick={() => toggle(id, ok, slotCount(id))} aria-label={t(id === 'hint' ? 'hint' : 'pw_' + id)}>
              <img className="v5pic" alt="" draggable="false" src={`${ART}v5/slot-blue.webp`} style={rect(0, 0, SLOT_W, SLOT_H)} />
              <div className="ptxt" style={rect(22, 14, 96, 96)}>
                {!ok ? (
                  <img src={`${ART}v5/lock-m.webp`} alt="" draggable="false" style={{ width: '70%', height: '90%', objectFit: 'contain' }} />
                ) : id === 'hint' ? (
                  <Bulb size="100%" />
                ) : (
                  <PowerIcon id={id} size="100%" />
                )}
              </div>
              {ok && <span className="ptxt count-badge pink" style={{ ...rect(88, 73, 50, 50), ...fs(26) }}>{t.n(slotCount(id))}</span>}
              {ok && on && <img className="v5pic pick-mark" alt="" draggable="false" src={`${ART}v5/checkbox.webp`} style={rect(3, 3, 50, 47)} />}
            </button>
          );
        })}
        <button className="pbtn start-play" style={rect(CENTER_X - 210, 702, 420, 172)} onClick={() => onPlay(picks)}>
          <img className="v5pic" alt="" draggable="false" src={`${ART}v5/btn-play-green.webp`} style={rect(0, 0, 420, 172)} />
          <span style={{ ...rect(0, 0, 420, 146), display: 'grid', placeItems: 'center', ...fs(74) }}>{t('letsGo2')}</span>
        </button>
        <button
          className="pbtn"
          style={rect(CENTER_X - 120, 876, 240, 96)}
          onClick={() => {
            sfx.close();
            onClose();
          }}
        >
          <img className="v5pic" alt="" draggable="false" src={`${ART}v5/btn-red.webp`} style={rect(0, 0, 240, 96)} />
          <span style={{ ...rect(0, 0, 240, 85), display: 'grid', placeItems: 'center', ...fs(40) }}>{t('goBack')}</span>
        </button>
        {note && <div className="pop-toast" style={{ top: `${(1010 / DH) * 100}%` }}>{note}</div>}
      </Popup>
      {lesson && (
        <Modal key={lesson} pose="point" title={t('pw_' + lesson)}>
          {(leave) => (
            <>
              <PowerIcon id={lesson} size={96} />
              <p className="goal">{t('pwi_' + lesson)}</p>
              <div className="modal-actions">
                <button
                  className="btn big yellow"
                  onClick={() => {
                    sfx.hint();
                    leave(() => markTaught(lesson));
                  }}
                >
                  {t('gotIt')}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
