import { useState } from 'react';
import { Popup, PandaPeek, Ribbon, Pic, rect, k, fs, box, man } from './v5.jsx';
import { PowerIcon, Bulb } from './icons.jsx';
import { useT } from '../i18n.js';
import { useSave } from '../store.js';
import { ART } from '../board/sprites.js';
import { POWERUP_STAGE, VIDEO_COINS } from '../config.js';
import { stageOfLevel } from '../game/stages.js';
import { ads } from '../services/ads.js';
import { addCoins } from '../store.js';
import { sfx } from '../audio.js';

const O = [10, 130];
const STAR_BOX = [
  [244, 426, 304],
  [615, 463, 241],
  [924, 426, 303],
];
// booster slots (x of the left edge, PSD coordinates)
const SLOT_X = [406, 625, 844];
const SLOTS = ['star', 'peek', 'hint'];

/** "Level #" popup shown before a station starts (v5 mockup 09): stars, goal chips, boosters, Play. */
export default function StartPopup({ level, levelNo, inStage, stars, maxCoins, tutorial, onPlay, onClose, onCoins }) {
  const t = useT();
  const save = useSave();
  const [picks, setPicks] = useState([]);
  const [note, setNote] = useState('');
  const stage = stageOfLevel(levelNo);
  const unlockedPw = stage >= POWERUP_STAGE;
  const lanes = level.lanes.length;
  const toggle = (id, ok, count) => {
    sfx.click();
    if (!ok) return setNote(t('boosterLocked', { n: t.n(POWERUP_STAGE) }));
    if (count <= 0) return setNote(t('noPower'));
    setNote('');
    setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };
  const free = async () => {
    if (await ads.rewarded()) addCoins(VIDEO_COINS);
  };
  const slotCount = (id) => (id === 'hint' ? save.hints : save.powerups[id] || 0);
  const chips = [
    { ico: '🚂', txt: `×${t.n(lanes)}`, key: 'lanes' },
    { ico: '▦', txt: `${t.n(level.rows)}×${t.n(level.cols)}`, key: 'size' },
    { ico: '★', txt: `×${t.n(level.given.length)}`, key: 'stars', hide: !level.given.length },
  ].filter((c) => !c.hide);
  const cw = 818 / Math.max(1, chips.length);
  return (
    <Popup dw={1430} dh={2000} o={O} bg="start-popup" close={[1220, 467, 1356, 610]} onClose={onClose}>
      <PandaPeek skin={save.pandaSkin} cx={721 - 10} by={310 - 130} w={320} h={205} pose="wave" />
      <Ribbon x={721 - 10} y={362 - 130}>
        {t('station')} {t.n(inStage)}
      </Ribbon>
      {STAR_BOX.map(([x, y, w], i) => (
        <img key={i} className="v5pic" alt="" draggable="false" src={`${ART}map/ui/star-${i < stars ? 'gold' : 'grey'}.webp`} style={{ ...rect(x - O[0], y - O[1], w, w * 0.95), objectFit: 'contain' }} />
      ))}
      <div className="ptxt" style={{ ...rect(515 - O[0], 750 - O[1], 400, 67), ...fs(58), color: '#1f5662' }}>
        {t('levelGoal')}
      </div>
      <Pic name="target-bg" o={O} />
      <div style={{ ...box('target-bg', O), display: 'flex' }}>
        {chips.map((c) => (
          <div key={c.key} className="ptxt" style={{ position: 'relative', flex: 1, ...fs(54), color: '#fff', gap: k(12) }}>
            <span style={{ fontSize: k(60) }}>{c.ico}</span>
            {c.txt}
          </div>
        ))}
      </div>
      {SLOTS.map((id, i) => {
        const ok = id === 'hint' ? !tutorial : unlockedPw;
        const on = picks.includes(id);
        const x = SLOT_X[i] - O[0];
        const y = 1057 - O[1];
        return (
          <button key={id} className={'slotbtn' + (ok && slotCount(id) <= 0 ? ' off' : '')} style={rect(x, y, 169, 150)} onClick={() => toggle(id, ok, slotCount(id))} aria-label={t(id === 'hint' ? 'hint' : 'pw_' + id)}>
            <img className="v5pic" alt="" draggable="false" src={`${ART}v5/${ok ? 'slot-blue' : 'slot-pink'}.webp`} style={rect(0, 0, 169, 150)} />
            <div className="ptxt" style={rect(0, 8, 169, 130)}>
              {id === 'hint' ? <Bulb size={52} /> : <PowerIcon id={id} size={52} />}
            </div>
            {ok && <span className="badge2" style={{ left: k(-14), bottom: k(-14) }}>{t.n(slotCount(id))}</span>}
            {ok && on && <img className="v5pic" alt="" draggable="false" src={`${ART}v5/checkbox.webp`} style={rect(100, -34, 80, 76)} />}
            {!ok && <img className="v5pic" alt="" draggable="false" src={`${ART}v5/lock-s.webp`} style={rect(98, 62, 66, 82)} />}
          </button>
        );
      })}
      <button className="pbtn" style={box('btn-play', O)} onClick={() => onPlay(picks)}>
        <img className="v5pic" alt="" draggable="false" src={`${ART}v5/btn-play.webp`} style={rect(0, 0, 436, 179)} />
        <span style={{ ...rect(0, 0, 436, 150), display: 'grid', placeItems: 'center', ...fs(86) }}>{t('letsGo2')}</span>
      </button>
      {note && <div className="pop-toast" style={{ top: k(1480 - O[1] - 70) }}>{note}</div>}
      <div className="ptxt" style={{ ...box('target-bg', O), top: k(1560 - O[1]), left: k(150 - O[0]), width: k(1120), height: k(210), flexDirection: 'column', gap: k(14), whiteSpace: 'normal', ...fs(46) }}>
        {!tutorial ? (
          <span>
            {t('upTo', { n: t.n(maxCoins) })} <img className="pcoin" alt="" src={`${ART}v5/coin-gold.webp`} />
          </span>
        ) : (
          <span>{t('goalLearn')}</span>
        )}
        {lanes > 1 && <small style={{ ...fs(36), opacity: 0.85 }}>{t('goalLanes')}</small>}
      </div>
      {ads.rewardedAvailable() && (
        <button className="pbtn" style={box('btn-free', O)} onClick={free}>
          <img className="v5pic" alt="" draggable="false" src={`${ART}v5/btn-free.webp`} style={rect(0, 0, 700, 176)} />
          <span style={{ ...rect(240, 40, 440, 100), display: 'grid', placeItems: 'center', ...fs(58) }}>
            {t('freeCoins')} +{t.n(VIDEO_COINS)}
          </span>
        </button>
      )}
    </Popup>
  );
}
