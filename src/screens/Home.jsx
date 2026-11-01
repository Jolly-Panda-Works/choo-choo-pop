import { useT } from '../i18n.js';
import { sfx } from '../audio.js';
import { APP_VERSION } from '../config.js';
import { useSave } from '../store.js';
import { CoinChip } from '../ui/icons.jsx';
import Logotype from '../ui/Logotype.jsx';
import { V5_ART } from '../board/sprites.js';
import M from '../ui/v5manifest.json';
import { missionDone } from '../game/missions.js';

const W = 1440;
const H = 2280;
// the four round buttons sit on one gentle arc below Play: [x, y] of the top-left corner, all 252 x 266 design px
// everything under the logo is pushed down by DY design px so the Play button no longer touches the logotype
const DY = 105;
const ROW = { 'h-settings': [100, 1305 + DY], 'h-map': [429, 1385 + DY], 'h-missions': [758, 1385 + DY], 'h-shop': [1087, 1305 + DY] };
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
        {btn('h-settings', onSettings, t('settings'))}
        {btn('h-map', onMap, t('map'))}
        {btn('h-missions', onMissions, t('missions'))}
        {btn('h-shop', onShop, t('shop'))}
      </div>
      <CoinChip className="home-coins" amount={t.n(save.coins)} onClick={go(onCoins)} label={t('coins')} />
      <p className="ver">
        {t('version')} {t.n(APP_VERSION)}
      </p>
    </main>
  );
}
