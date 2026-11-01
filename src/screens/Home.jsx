import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n.js';
import { sfx } from '../audio.js';
import { useSave, spinReady, starBalance, addCoins } from '../store.js';
import { VIDEO_COINS } from '../config.js';
import { ads } from '../services/ads.js';
import { CoinChip } from '../ui/icons.jsx';
import Logotype from '../ui/Logotype.jsx';
import { ART, UI_ART, V5_ART } from '../board/sprites.js';
import M from '../ui/v5manifest.json';
import { missionDone } from '../game/missions.js';
import { TRAIN_SKINS, RAIL_SKINS } from '../game/skins.js';

// on the Home ground: [flower, left, bottom, width] in % of the screen width
const FLOWERS = [
  ['pink', 10, 23, 10],
  ['yellow', 25, 15, 9],
  ['pink', 37, 26, 8],
  ['yellow', 8, 8, 8],
];

const W = 1440;
const H = 2280;
// the four round buttons sit on one gentle arc below Play: [x, y] of the top-left corner, all 252 x 266 design px
// everything under the logo is pushed down by DY design px so the Play button no longer touches the logotype
const DY = 235;
const ROW = { 'h-spin': [100, 1305 + DY], 'h-map': [429, 1385 + DY], 'h-missions': [758, 1385 + DY], 'h-shop': [1087, 1305 + DY] };
const pct = (x0, y0, x1, y1) => ({ left: `${(x0 / W) * 100}%`, top: `${(y0 / H) * 100}%`, width: `${((x1 - x0) / W) * 100}%`, height: `${((y1 - y0) / H) * 100}%` });
const pos = (name) => {
  if (ROW[name]) {
    const [x, y] = ROW[name];
    return pct(x, y, x + 252, y + 266);
  }
  const [x0, y0, x1, y1] = M[name]; // h-play keeps its mockup size, just lower
  return pct(x0, y0 + DY, x1, y1 + DY);
};

/** Home (v5 mockup 01): the PSD scene, a big round Play button and Settings / Missions / Shop bubbles. */
export default function Home({ onPlay, onMap, onCoins, onShop, onSettings, onMissions, onSpin, onCustomize }) {
  const t = useT();
  const save = useSave();
  const [note, setNote] = useState('');
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const freeCoins = async () => {
    sfx.click();
    if (ads.rewardedAvailable()) {
      if (await ads.rewarded()) {
        addCoins(VIDEO_COINS);
        sfx.coins();
      }
      return;
    }
    setNote(t('noVideo'));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(''), 2300);
  };
  const go = (fn) => () => {
    sfx.click();
    fn();
  };
  const claimable = [...(save.mis?.daily || []), ...(save.mis?.weekly || [])].filter((x) => missionDone(x) && !x.claimed).length;
  const stars = starBalance(save);
  const affordable = (list, owned) => list.filter((s) => !owned.includes(s.id) && s.stars <= stars).length;
  const newLooks = affordable(TRAIN_SKINS, save.ownedTrain) + affordable(RAIL_SKINS, save.ownedRail);
  const btn = (name, fn, label, extra = '') => (
    <button key={name} className={'h5btn ' + extra} style={pos(name)} onClick={go(fn)} aria-label={label}>
      <img src={`${V5_ART}${name}.webp`} alt="" draggable="false" />
      {name === 'h-missions' && claimable > 0 && <span className="h5badge">{t.n(claimable)}</span>}
      {name === 'h-spin' && spinReady(save) && <span className="h5badge">{t.n(1)}</span>}
      {name !== 'h-play' && <span className="h5label">{label}</span>}
    </button>
  );
  return (
    <main className="screen home5">
      <div className="home5-stage">
        <img src={`${V5_ART}home-bg.webp`} alt="" draggable="false" style={{ left: 0, top: 0 }} />
      </div>
      {/* the background covers the screen and may be cropped on tall phones; the buttons always fit inside it */}
      <img className="home-floor" src={`${V5_ART}home-floor.webp`} alt="" draggable="false" />
      {FLOWERS.map(([kind, x, y, w]) => (
        <img key={x} className="home-flower" src={`${ART}deco/flower-${kind}.webp`} alt="" draggable="false" style={{ left: `${x}cqw`, bottom: `${y}cqw`, width: `${w}cqw` }} />
      ))}
      <img className="home-tree tall" src={`${UI_ART}tree-yellow.webp`} alt="" draggable="false" />
      <img className="home-tree small" src={`${UI_ART}tree-rose.webp`} alt="" draggable="false" />
      <div className="home5-ui">
        <div className="home5-logo" style={{ left: '18%', top: 'max(6.5%, calc(58px + env(safe-area-inset-top)))', width: '64%', height: '20%' }}>
          <Logotype className="bob" />
        </div>
        {btn('h-play', onPlay, t('play'), 'h5play')}
        {btn('h-spin', onSpin, t('spinWheel'))}
        {btn('h-map', onMap, t('explore'))}
        {btn('h-missions', onMissions, t('missions'))}
        {btn('h-shop', onShop, t('shop'))}
      </div>
      <button className="home-settings" onClick={go(onSettings)} aria-label={t('settings')}>
        <img src={`${V5_ART}h-settings.webp`} alt="" draggable="false" />
      </button>
      <button className="home-settings custom" onClick={go(onCustomize)} aria-label={t('customize')}>
        <img src={`${V5_ART}h-custom.webp`} alt="" draggable="false" />
        {newLooks > 0 && <span className="h5badge">{t.n(newLooks)}</span>}
      </button>
      <CoinChip className="home-coins" amount={t.n(save.coins)} onClick={go(onCoins)} label={t('coins')} />
      <button className="home-free" onClick={freeCoins} aria-label={t('freeCoins')}>
        <img src={`${V5_ART}icon-free-coins.webp`} alt="" draggable="false" />
      </button>
      {note && <div className="home-toast">{note}</div>}
    </main>
  );
}
