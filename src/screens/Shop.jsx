import { useEffect, useRef, useState } from 'react';
import { useSave, buyHintPack, buySkin, equipSkin, addHints } from '../store.js';
import { useT } from '../i18n.js';
import { HINT_PACKS, COIN_PACKS, REMOVE_ADS_ID } from '../config.js';
import { TRAIN_SKINS, PANDA_SKINS } from '../game/skins.js';
import { ads } from '../services/ads.js';
import { billing } from '../services/billing.js';
import { loadSprites, getTrainSet, getSprites } from '../board/sprites.js';
import { sfx } from '../audio.js';
import Panda from '../ui/Panda.jsx';
import ParentGate from '../ui/ParentGate.jsx';
import { BackIcon, Coin, Bulb } from '../ui/icons.jsx';

function TrainPreview({ skin }) {
  const ref = useRef(null);
  useEffect(() => {
    let live = true;
    loadSprites().then(() => {
      if (!live || !ref.current) return;
      const sp = getSprites();
      const set = getTrainSet(skin);
      const g = ref.current.getContext('2d');
      const W = 150;
      const H = 60;
      g.clearRect(0, 0, W, H);
      const draw = (img, trim, x) => {
        const k = 62 / trim.w;
        g.drawImage(img, trim.x, trim.y, trim.w, trim.h, x, H / 2 - (trim.h * k) / 2, trim.w * k, trim.h * k);
      };
      draw(set.wagons[0], sp.wagonTrim, 2);
      draw(set.engine, sp.engineTrim, 80);
    });
    return () => {
      live = false;
    };
  }, [skin]);
  return <canvas ref={ref} width="150" height="60" className="train-prev" />;
}

export default function Shop({ onBack }) {
  const save = useSave();
  const t = useT();
  const [prices, setPrices] = useState({});
  const [gate, setGate] = useState(null); // product id waiting for the grown-up check
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const timer = useRef();

  useEffect(() => {
    billing.prices().then(setPrices);
    return () => clearTimeout(timer.current);
  }, []);
  const say = (m) => {
    setNote(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(''), 2400);
  };

  const buyPack = (pack) => {
    if (buyHintPack(pack)) {
      sfx.hint();
      say(t('bought'));
    } else {
      sfx.error();
      say(t('notEnoughCoins'));
    }
  };
  const buySkinTap = (kind, list, skin) => {
    const owned = (kind === 'train' ? save.ownedTrain : save.ownedPanda).includes(skin.id);
    if (!owned && !buySkin(kind, skin)) {
      sfx.error();
      say(t('notEnoughCoins'));
      return;
    }
    equipSkin(kind, skin.id);
    sfx.hint();
  };
  const freeHint = async () => {
    if (await ads.rewarded()) {
      addHints(1);
      say(t('gotHint'));
    }
  };
  const pay = async (id) => {
    setGate(null);
    setBusy(true);
    const ok = await billing.buy(id);
    setBusy(false);
    say(ok ? t('thanks') : t('purchaseFailed'));
    if (ok) sfx.win();
  };

  const store = billing.available();
  const price = (id) => prices[id] || '—';

  return (
    <main className="screen shop">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label={t('back')}>
          <BackIcon />
        </button>
        <h2>{t('shop')}</h2>
        <span className="chip coin-chip">
          <Coin size={20} /> {t.n(save.coins)}
        </span>
      </header>

      <div className="shop-scroll">
        {note && <div className="toast shop-toast">{note}</div>}

        <section className="shop-sec">
          <h3>
            <Bulb size={22} /> {t('hints')} <small>({t.n(save.hints)})</small>
          </h3>
          {ads.rewardedAvailable() && (
            <button className="shop-card free" onClick={freeHint}>
              <span className="shop-ico">▶</span>
              <span className="shop-info">
                <b>{t('freeHint')}</b>
                <small>{t('watchShort')}</small>
              </span>
              <span className="price free-tag">{t('free')}</span>
            </button>
          )}
          {HINT_PACKS.map((p) => (
            <button key={p.id} className="shop-card" onClick={() => buyPack(p)} disabled={save.coins < p.price}>
              <span className="shop-ico">
                <Bulb size={34} />
                <i>{t.n(p.hints)}</i>
              </span>
              <span className="shop-info">
                <b>{t(p.id === 'hints_small' ? 'smallPack' : 'bigPack')}</b>
                <small>{t('hintsCount', { n: t.n(p.hints) })}</small>
              </span>
              <span className="price">
                <Coin size={20} /> {t.n(p.price)}
              </span>
            </button>
          ))}
        </section>

        <section className="shop-sec">
          <h3>
            <Coin size={22} /> {t('coins')}
          </h3>
          {!store && <p className="small">{t('storeSoon')}</p>}
          {COIN_PACKS.map((p) => (
            <button key={p.id} className="shop-card" disabled={!store || busy} onClick={() => setGate(p.id)}>
              <span className="shop-ico coins">
                <Coin size={36} />
              </span>
              <span className="shop-info">
                <b>{t.n(p.coins)}</b>
                <small>{p.bonus ? t('bestValue') : ' '}</small>
              </span>
              <span className="price real">{price(p.id)}</span>
            </button>
          ))}
          <button
            className="shop-card"
            disabled={!store || busy || save.adsRemoved}
            onClick={() => setGate(REMOVE_ADS_ID)}
          >
            <span className="shop-ico">🚫</span>
            <span className="shop-info">
              <b>{t('removeAds')}</b>
              <small>{save.adsRemoved ? t('adsRemoved') : t('removeAdsInfo')}</small>
            </span>
            <span className="price real">{save.adsRemoved ? '✓' : price(REMOVE_ADS_ID)}</span>
          </button>
        </section>

        <section className="shop-sec">
          <h3>🚂 {t('trainLooks')}</h3>
          <div className="skin-grid">
            {TRAIN_SKINS.map((s) => {
              const owned = save.ownedTrain.includes(s.id);
              const on = save.trainSkin === s.id;
              return (
                <button key={s.id} className={'skin' + (on ? ' on' : '')} onClick={() => buySkinTap('train', TRAIN_SKINS, s)}>
                  <TrainPreview skin={s.id} />
                  <b>{t('skin_' + s.id)}</b>
                  <span className="price">{on ? t('using') : owned ? t('use') : (<><Coin size={18} /> {t.n(s.price)}</>)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="shop-sec">
          <h3>🐼 {t('pandaLooks')}</h3>
          <div className="skin-grid">
            {PANDA_SKINS.map((s) => {
              const owned = save.ownedPanda.includes(s.id);
              const on = save.pandaSkin === s.id;
              return (
                <button key={s.id} className={'skin' + (on ? ' on' : '')} onClick={() => buySkinTap('panda', PANDA_SKINS, s)}>
                  <Panda pose="salute" skin={s.id} size={74} />
                  <b>{t('skin_' + s.id)}</b>
                  <span className="price">{on ? t('using') : owned ? t('use') : (<><Coin size={18} /> {t.n(s.price)}</>)}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {gate && <ParentGate onPass={() => pay(gate)} onCancel={() => setGate(null)} />}
    </main>
  );
}
