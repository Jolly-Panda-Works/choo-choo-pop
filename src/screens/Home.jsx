import { useT } from '../i18n.js';
import { sfx } from '../audio.js';
import { APP_VERSION } from '../config.js';
import { useSave } from '../store.js';
import { Coin } from '../ui/icons.jsx';
import Logotype from '../ui/Logotype.jsx';
import { V5_ART } from '../board/sprites.js';
import M from '../ui/v5manifest.json';
import { missionDone } from '../game/missions.js';

const W = 1440;
const H = 2280;
// the three round buttons sit lower than in the mockup to make room for the Map button under Play
const LOWER = { 'h-settings': 230, 'h-missions': 230, 'h-shop': 230 };
const MAP_BTN = [541, 1372, 901, 1523];
const pos = (name) => {
  const [x0, y0, x1, y1] = M[name];
  const dy = LOWER[name] || 0;
  return pos2(x0, y0 + dy, x1, y1 + dy);
};
const pos2 = (x0, y0, x1, y1) => {
  return { left: `${(x0 / W) * 100}%`, top: `${(y0 / H) * 100}%`, width: `${((x1 - x0) / W) * 100}%`, height: `${((y1 - y0) / H) * 100}%` };
};

/** Home (v5 mockup 01): the PSD scene, a big round Play button and Settings / Missions / Shop bubbles. */
export default function Home({ onPlay, onMap, onCoins, onShop, onSettings, onMissions }) {
  const t = useT();
  const save = useSave();
  const go = (fn) => () => {
    sfx.click();
    fn();
  };
  const claimable = [...(save.mis?.daily || []), ...(save.mis?.weekly || [])].filter((x) => missionDone(x) && !x.claimed).length;
  const btn = (name, fn, label, extra = '') => (
    <button key={name} className={'h5btn ' + extra} style={pos(name)} onClick={go(fn)} aria-label={label}>
      <img src={`${V5_ART}${name}.webp`} alt="" draggable="false" />
      {name === 'h-missions' && claimable > 0 && <span className="h5badge">{t.n(claimable)}</span>}
    </button>
  );
  return (
    <main className="screen home5">
      <div className="home5-stage">
        <img src={`${V5_ART}home-bg.webp`} alt="" draggable="false" style={{ left: 0, top: 0 }} />
        <div className="home5-logo" style={{ left: '15%', top: '3.5%', width: '70%', height: '20%' }}>
          <Logotype className="bob" />
        </div>
        {btn('h-play', onPlay, t('play'), 'h5play')}
        <button
          className="h5btn h5map"
          style={pos2(...MAP_BTN)}
          onClick={go(onMap)}
          aria-label={t('map')}
        >
          <img src={`${V5_ART}btn-orange.webp`} alt="" draggable="false" />
          <span>{t('map')}</span>
        </button>
        {btn('h-settings', onSettings, t('settings'))}
        {btn('h-missions', onMissions, t('missions'))}
        {btn('h-shop', onShop, t('shop'))}
      </div>
      <button className="chip coin-chip home-coins" onClick={go(onCoins)} aria-label={t('coins')}>
        <Coin size={24} /> {t.n(save.coins)} <b className="plus">+</b>
      </button>
      <p className="ver">
        {t('version')} {t.n(APP_VERSION)}
      </p>
    </main>
  );
}
