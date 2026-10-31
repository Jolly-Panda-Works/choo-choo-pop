import { useT } from '../i18n.js';
import { sfx } from '../audio.js';
import { APP_VERSION } from '../config.js';
import { useSave } from '../store.js';
import { Coin } from '../ui/icons.jsx';
import Logotype from '../ui/Logotype.jsx';
import { ua, uaDelay } from '../anim/ua.js';

export default function Home({ onPlay, onMap, onShop, onSettings, hasProgress }) {
  const t = useT();
  const save = useSave();
  const go = (fn) => () => {
    sfx.click();
    fn();
  };
  return (
    <main className="screen home">
      <button className="chip coin-chip home-coins" onClick={go(onShop)} aria-label={t('shop')}>
        <Coin size={20} /> {t.n(save.coins)}
      </button>
      <div className="home-top">
        <Logotype className="bob" />
      </div>
      <div className="home-actions">
        <button className={'btn big yellow ' + ua('buttons-bubbles-enter1')} onClick={go(onPlay)}>
          {hasProgress ? t('continue') : t('play')}
        </button>
        <button className={'btn big blue ' + ua('buttons-bubbles-enter2')} style={uaDelay(0.1)} onClick={go(onMap)}>
          {t('map')}
        </button>
        <div className="btn-row">
          <button className={'btn ' + ua('buttons-bubbles-enter3')} style={uaDelay(0.2)} onClick={go(onShop)}>
            {t('shop')}
          </button>
          <button className={'btn ' + ua('buttons-bubbles-enter4')} style={uaDelay(0.3)} onClick={go(onSettings)}>
            {t('settings')}
          </button>
        </div>
      </div>
      <p className="ver">
        {t('version')} {t.n(APP_VERSION)}
      </p>
    </main>
  );
}
