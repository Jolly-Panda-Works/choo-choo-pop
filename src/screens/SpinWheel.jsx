import { useEffect, useRef, useState } from 'react';
import { k, fs } from '../ui/v5.jsx';
import BluePopup, { inPopup } from '../ui/BluePopup.jsx';
import { PowerIcon, Bulb } from '../ui/icons.jsx';
import { useSave, addCoins, addHints, addPowerup, spinReady, useFreeSpin } from '../store.js';
import { useT } from '../i18n.js';
import { ads } from '../services/ads.js';
import { ART } from '../board/sprites.js';
import { sfx } from '../audio.js';

// The lucky wheel: one free spin a day, more with a rewarded video. Slices run clockwise from the top.
const PRIZES = [{ coins: 20 }, { hints: 1 }, { coins: 50 }, { power: 'star' }, { coins: 10 }, { power: 'eraser' }, { coins: 100 }, { power: 'peek' }];
// a power-up the player has not been taught yet gives this instead
const BEFORE_LESSON = { star: { hints: 1 }, eraser: { coins: 30 }, peek: { coins: 40 } };
const SLICE = 360 / PRIZES.length;
const TURNS = 5;
const SPIN_MS = 4300;
const WHEEL = 960;
const WHEEL_X = (1418 - WHEEL) / 2 + 15;
const WHEEL_Y = 570;

const give = (p) => {
  if (p.coins) addCoins(p.coins);
  if (p.hints) addHints(p.hints);
  if (p.power) addPowerup(p.power);
};

function PrizeIcon({ prize }) {
  if (prize.hints) return <Bulb size="56%" />;
  if (prize.power) return <PowerIcon id={prize.power} size="56%" />;
  return <img src={`${ART}v5/coin-gold.webp`} alt="" draggable="false" />;
}

export default function SpinWheel({ onBack }) {
  const t = useT();
  const save = useSave();
  const [angle, setAngle] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const timers = useRef([]);
  useEffect(() => {
    sfx.wheelOpen();
    return () => timers.current.forEach(clearTimeout);
  }, []);
  const say = (m) => {
    setNote(m);
    timers.current.push(setTimeout(() => setNote(''), 2400));
  };
  const label = (p) => (p.coins ? t.n(p.coins) : '+' + t.n(1));
  const prizes = PRIZES.map((p) => (p.power && !save.taught[p.power] ? BEFORE_LESSON[p.power] : p));

  const spin = () => {
    const i = Math.floor(Math.random() * prizes.length);
    const stop = 360 - i * SLICE;
    setBusy(true);
    sfx.wheelSpin();
    setAngle((a) => a - (a % 360) + TURNS * 360 + stop);
    timers.current.push(
      setTimeout(() => {
        give(prizes[i]);
        setBusy(false);
        sfx.coins();
        say(t('thanks'));
      }, SPIN_MS),
    );
  };
  const free = spinReady(save);
  const video = !free && ads.rewardedAvailable();
  const go = async () => {
    if (busy) return;
    if (free) {
      useFreeSpin();
      spin();
    } else if (video && (await ads.rewarded())) spin();
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
        <span style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: k(22), display: 'grid', placeItems: 'center', ...fs(free ? 60 : 44) }}>{free ? t('spinFree') : video ? t('spinVideo') : t('spinTomorrow')}</span>
      </button>
      {note && <div className="pop-toast" style={{ top: k(900) }}>{note}</div>}
    </BluePopup>
  );
}
