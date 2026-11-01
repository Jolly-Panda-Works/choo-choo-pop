import { useEffect, useRef, useState } from 'react';
import { Popup, PandaPeek, Ribbon, Pic, rect, k, fs, box } from '../ui/v5.jsx';
import ParentGate from '../ui/ParentGate.jsx';
import { usePandaSrc } from '../ui/Panda.jsx';
import { PowerIcon, Bulb } from '../ui/icons.jsx';
import { useSave, buyHintPack, buySkin, equipSkin, addHints, buyPowerup } from '../store.js';
import { useT } from '../i18n.js';
import { HINT_PACKS, REMOVE_ADS_ID, POWERUPS, POWERUP_PACK } from '../config.js';
import { TRAIN_SKINS, PANDA_SKINS } from '../game/skins.js';
import { ads } from '../services/ads.js';
import { billing } from '../services/billing.js';
import { loadSprites, getTrainSet, getSprites, ART } from '../board/sprites.js';
import { sfx } from '../audio.js';

const O = [60, 90];
const PITCH = 285;
const ROW0 = 21;
const LIST = [118, 712, 1331, 2060];
const TABS_Y = 606;
const TABS = [
  { id: 'boost', label: 'tabBoosts' },
  { id: 'train', label: 'tabTrains' },
  { id: 'panda', label: 'tabPandas' },
  { id: 'ads', label: 'tabAds' },
];

function PandaFace({ skin }) {
  const src = usePandaSrc('salute', skin);
  return <img src={src} alt="" draggable="false" style={{ height: '100%', width: 'auto' }} />;
}

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
        const kk = 62 / trim.w;
        g.drawImage(img, trim.x, trim.y, trim.w, trim.h, x, H / 2 - (trim.h * kk) / 2, trim.w * kk, trim.h * kk);
      };
      draw(set.wagons[0], sp.wagonTrim, 2);
      draw(set.engine, sp.engineTrim, 80);
    });
    return () => {
      live = false;
    };
  }, [skin]);
  return <canvas ref={ref} width="150" height="60" style={{ width: '100%', height: 'auto' }} />;
}

export default function Shop({ onBack, onCoins }) {
  const save = useSave();
  const t = useT();
  const [prices, setPrices] = useState({});
  const [gate, setGate] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [tab, setTab] = useState('boost');
  const timer = useRef();
  useEffect(() => {
    billing.prices().then(setPrices);
    return () => clearTimeout(timer.current);
  }, []);
  const say = (m) => {
    setNote(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(''), 2300);
  };
  const noCoins = () => {
    sfx.error();
    say(t('notEnoughCoins'));
  };
  const store = billing.available();

  // one entry per row: { key, icon, name, info, btn: {label, coin?, real?, on?, disabled?, run} }
  const rows = [];
  if (ads.rewardedAvailable())
    rows.push({ tab: 'boost', key: 'vid', icon: <span style={{ fontSize: k(110) }}>▶</span>, name: t('freeHint'), info: t('watchShort'), btn: { label: t('free'), run: async () => ((await ads.rewarded()) && (addHints(1), say(t('gotHint')))) } });
  for (const p of POWERUPS)
    rows.push({
      tab: 'boost',
      key: 'pw' + p.id,
      icon: <PowerIcon id={p.id} size="62%" />,
      count: save.powerups[p.id] || 0,
      name: t('pw_' + p.id),
      info: t('pwi_' + p.id),
      btn: { label: t.n(p.price * POWERUP_PACK), coin: true, plus: POWERUP_PACK, run: () => (buyPowerup(p.id) ? (sfx.hint(), say(t('bought'))) : noCoins()) },
    });
  for (const h of HINT_PACKS)
    rows.push({
      tab: 'boost',
      key: h.id,
      icon: <Bulb size="56%" />,
      count: h.hints,
      name: t(h.id === 'hints_small' ? 'smallPack' : 'bigPack'),
      info: t('hintsCount', { n: t.n(h.hints) }),
      btn: { label: t.n(h.price), coin: true, run: () => (buyHintPack(h) ? (sfx.hint(), say(t('bought'))) : noCoins()) },
    });
  const skinRows = (kind, list, owned, cur) =>
    list.map((s) => {
      const has = owned.includes(s.id);
      const on = cur === s.id;
      return {
        tab: kind,
        key: kind + s.id,
        icon: kind === 'train' ? <div style={{ width: '88%' }}><TrainPreview skin={s.id} /></div> : <PandaFace skin={s.id} />,
        name: `${t(kind === 'train' ? 'trainLooks' : 'pandaLooks')} · ${t('skin_' + s.id)}`,
        info: '',
        btn: {
          label: on ? t('using') : has ? t('use') : t.n(s.price),
          coin: !has && !on,
          run: () => {
            if (!has && !buySkin(kind, s)) return noCoins();
            equipSkin(kind, s.id);
            sfx.hint();
          },
        },
      };
    });
  rows.push(...skinRows('train', TRAIN_SKINS, save.ownedTrain, save.trainSkin));
  rows.push(...skinRows('panda', PANDA_SKINS, save.ownedPanda, save.pandaSkin));
  rows.push({
    tab: 'ads',
    key: 'ads',
    icon: <span style={{ fontSize: k(110) }}>🚫</span>,
    name: t('removeAds'),
    info: save.adsRemoved ? t('adsRemoved') : t('removeAdsInfo'),
    btn: { label: save.adsRemoved ? '✓' : prices[REMOVE_ADS_ID] || '—', disabled: !store || busy || save.adsRemoved, real: true, run: () => setGate(REMOVE_ADS_ID) },
  });

  const pay = async (id) => {
    setGate(null);
    setBusy(true);
    const ok = await billing.buy(id);
    setBusy(false);
    say(ok ? t('thanks') : t('purchaseFailed'));
    if (ok) sfx.win();
  };
  const shown = rows.filter((r) => r.tab === tab);
  const owned = save.hints + Object.values(save.powerups).reduce((a, b) => a + b, 0);

  return (
    <>
      <Popup dw={1320} dh={2010} o={O} bg="shop-popup" close={[1222, 463, 1366, 614]} onClose={onBack}>
        <PandaPeek skin={save.pandaSkin} cx={731 - O[0]} by={345 - O[1]} />
        <Ribbon x={730 - O[0]} y={395 - O[1]}>
          {t('shop')}
        </Ribbon>
        <Pic name="chip-items" o={O} />
        <div className="ptxt" style={{ ...rect(398 - O[0], 500 - O[1], 90, 48), ...fs(44) }}>{t.n(owned)}</div>
        <Pic name="chip-coins-shop" o={O} />
        <button style={box('chip-coins-shop', O)} onClick={onCoins} aria-label={t('coins')} />
        <div className="ptxt" style={{ ...rect(903 - O[0], 499 - O[1], 215, 49), ...fs(44) }}>{t.n(save.coins)}</div>

        <div className="ptabs" role="tablist" style={rect(LIST[0] - O[0], TABS_Y - O[1], LIST[2] - LIST[0], 84)}>
          {TABS.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={tab === x.id}
              className={'ptab' + (tab === x.id ? ' on' : '')}
              style={fs(36)}
              onClick={() => {
                sfx.click();
                setTab(x.id);
              }}
            >
              {t(x.label)}
            </button>
          ))}
        </div>

        <div key={tab} className="pop-list" style={rect(LIST[0] - O[0], LIST[1] - O[1], LIST[2] - LIST[0], LIST[3] - LIST[1])}>
          <div style={{ position: 'relative', height: k(ROW0 + shown.length * PITCH) }}>
            {shown.map((r, i) => {
              const blue = i % 2 === 0;
              return (
                <div key={r.key} className="prow" style={{ top: k(ROW0 + i * PITCH), left: k(27), width: k(1152), height: k(268) }}>
                  <img className="v5pic" alt="" draggable="false" src={`${ART}v5/shop-row-${blue ? 'blue' : 'pink'}.webp`} style={rect(0, 0, 1152, 268)} />
                  <div className="ptxt" style={rect(24, 24, 240, 220)}>{r.icon}</div>
                  {r.count != null && (
                    <span className="ptxt" style={{ ...rect(200, 170, 72, 72), ...fs(36), background: 'linear-gradient(#ff9fb4,#ff7a96)', border: `${k(5)} solid #fff`, borderRadius: '50%', color: '#fff' }}>
                      {t.n(r.count)}
                    </span>
                  )}
                  <div className="ptxt" style={{ ...rect(300, 36, 470, 70), ...fs(r.name.length > 20 ? 38 : 48), color: blue ? '#fff' : '#1f5662', justifyContent: 'flex-start' }}>{r.name}</div>
                  <div className="ptxt" style={{ ...rect(300, 112, 470, 120), ...fs(34), color: blue ? '#a8e8f7' : '#c2476c', justifyContent: 'flex-start', whiteSpace: 'normal', textAlign: 'start' }}>{r.info}</div>
                  <button className="pbtn" disabled={r.btn.disabled} style={rect(790, 66, 302, 129)} onClick={r.btn.run}>
                    <img className="v5pic" alt="" draggable="false" src={`${ART}v5/sbtn-${r.btn.real ? 'orange' : blue ? 'orange' : 'pink'}.webp`} style={rect(0, 0, 302, 129)} />
                    <span style={{ ...rect(0, 0, 302, 118), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: k(8), ...fs(r.btn.label.length > 7 ? 34 : 46) }}>
                      {r.btn.plus ? <small style={fs(30)}>×{t.n(r.btn.plus)}</small> : null}
                      {r.btn.coin && <img className="pcoin" alt="" src={`${ART}v5/coin-gold.webp`} />}
                      {r.btn.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        {note && <div className="pop-toast" style={{ top: k(700) }}>{note}</div>}
      </Popup>
      {gate && <ParentGate onPass={() => pay(gate)} onCancel={() => setGate(null)} />}
    </>
  );
}
