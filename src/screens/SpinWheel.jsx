import { useEffect, useRef, useState } from 'react';
import { k, fs } from '../ui/v5.jsx';
import BluePopup, { inPopup } from '../ui/BluePopup.jsx';
import { PowerIcon, Bulb } from '../ui/icons.jsx';
import { useSave, adSpinsRemaining, redeemWheelSpin, spinReady } from '../store.js';
import { dayKey } from '../game/missions.js';
import { useT } from '../i18n.js';
import { ads } from '../services/ads.js';
import { ART } from '../board/sprites.js';
import { sfx } from '../audio.js';

// The lucky wheel slices run clockwise from the top.
const PRIZES = [{ coins: 20 }, { hints: 1 }, { coins: 50 }, { hints: 1 }, { coins: 10 }, { coins: 30 }, { coins: 100 }, { power: 'peek' }];
// a power-up the player has not been taught yet gives this instead
const BEFORE_LESSON = { star: { hints: 1 }, eraser: { coins: 30 }, peek: { coins: 40 } };
const SLICE = 360 / PRIZES.length;
const TURNS = 5;
const SPIN_MS = 4300;
const WHEEL = 960;
const WHEEL_X = (1418 - WHEEL) / 2 + 15;
const WHEEL_Y = 570;

function PrizeIcon({ prize }) {
  if (prize.hints) return <Bulb size="56%" />;
  if (prize.power) return <PowerIcon id={prize.power} size="56%" />;
  return <img src={`${ART}v5/coin-gold.webp`} alt="" draggable="false" />;
}

export default function SpinWheel({ onBack, onCoinsInFlight }) {
  const t = useT();
  const save = useSave();
  const [today, setToday] = useState(dayKey);
  const [angle, setAngle] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const timers = useRef([]);
  useEffect(() => {
    sfx.wheelOpen();
    const checkDay = () => setToday(dayKey());
    const clock = setInterval(checkDay, 10000);
    document.addEventListener('visibilitychange', checkDay);
    return () => {
      clearInterval(clock);
      document.removeEventListener('visibilitychange', checkDay);
      timers.current.forEach(clearTimeout);
      onCoinsInFlight(0);
    };
  }, [onCoinsInFlight]);
  const say = (m) => {
    setNote(m);
    timers.current.push(setTimeout(() => setNote(''), 2400));
  };
  const label = (p) => (p.coins ? t.n(p.coins) : '+' + t.n(1));
  const prizes = PRIZES.map((p) => (p.power && !save.taught[p.power] ? BEFORE_LESSON[p.power] : p));

  const spin = (kind) => {
    const i = Math.floor(Math.random() * prizes.length);
    const prize = prizes[i];
    // Persist the prize immediately, but reveal the extra coins when the wheel stops.
    onCoinsInFlight(prize.coins || 0);
    if (!redeemWheelSpin(kind, prize)) {
      onCoinsInFlight(0);
      return;
    }
    const stop = 360 - i * SLICE;
    setBusy(true);
    sfx.wheelSpin();
    setAngle((a) => a - (a % 360) + TURNS * 360 + stop);
    timers.current.push(
      setTimeout(() => {
        onCoinsInFlight(0);
        setBusy(false);
        sfx.coins();
        say(prize.coins ? t('coinRewardAdded', { n: t.n(prize.coins) }) : t('thanks'));
      }, SPIN_MS),
    );
  };
  const free = spinReady(save, today);
  const remaining = adSpinsRemaining(save, today);
  const video = !free && remaining > 0 && ads.rewardedAvailable();
  const go = async () => {
    if (busy) return;
    if (spinReady()) {
      spin('free');
    } else if (adSpinsRemaining() > 0 && ads.rewardedAvailable()) {
      await ads.rewarded({ kind: 'spin' }, () => spin('ad'));
    }
  };

  return (
    <BluePopup frame="spin" quiet title={t('spinWheel')} onClose={busy ? undefined : onBack}>
      <div className="spin-wheel" style={{ ...inPopup(WHEEL_X, WHEEL_Y + 60, WHEEL, WHEEL), transform: `rotate(${angle}deg)` }}>
        <img src={`${ART}spin/wheel.webp`} alt="" draggable="false" />
        {prizes.map((p, i) => (
          <div key={i} className="spin-prize" style={{ transform: `rotate(${i * SLICE}deg) translateY(-96%)` }}>
            <PrizeIcon prize={p} />
            {label(p)}
          </div>
        ))}
      </div>
      <img className="v5pic" alt="" draggable="false" src={`${ART}spin/hub.webp`} style={inPopup(WHEEL_X + WHEEL / 2 - 80, WHEEL_Y + 60 + WHEEL / 2 - 80, 160, 160)} />
      <img className="v5pic" alt="" draggable="false" src={`${ART}spin/arrow.webp`} style={{ ...inPopup(WHEEL_X + WHEEL / 2 - 60, WHEEL_Y + 8, 120, 170), objectFit: 'contain', transform: 'rotate(180deg)' }} />
      <button className="pbtn" disabled={busy || (!free && !video)} style={inPopup(464, 1680, 520, 218)} onClick={go}>
        <img className="v5pic" alt="" draggable="false" src={`${ART}v5/btn-orange.webp`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        <span style={{ position: 'absolute', inset: '0 0 ' + k(22), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ...fs(free ? 60 : 44) }}>
          {free ? t('spinFree') : video ? t('spinVideo') : t(remaining ? 'spinVideoUnavailable' : 'spinTomorrow')}
          {video && <small style={fs(32)}>{t('spinVideoRemaining', { n: t.n(remaining) })}</small>}
        </span>
      </button>
      {note && <div className="pop-toast" style={{ top: k(900) }}>{note}</div>}
    </BluePopup>
  );
}
