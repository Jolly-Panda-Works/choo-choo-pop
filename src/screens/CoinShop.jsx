import { useEffect, useRef, useState } from 'react';
import { Popup, PandaPeek, Ribbon, Pic, rect, k, fs, box, man } from '../ui/v5.jsx';
import ParentGate from '../ui/ParentGate.jsx';
import { useT } from '../i18n.js';
import { useSave, addCoins, claimGift, giftReady } from '../store.js';
import { COIN_PACKS, packBonus, VIDEO_COINS, DAILY_GIFT_COINS } from '../config.js';
import { ads } from '../services/ads.js';
import { billing } from '../services/billing.js';
import { ART } from '../board/sprites.js';
import { sfx } from '../audio.js';

const O = [15, 10]; // PSD origin of the coin popup inside our box (popup image sits 230 design px below the top)
const ROW0 = 21; // first row below the top of the list window
const PITCH = 285;
const LIST = [57, 611, 1330, 2071]; // list window (PSD coordinates)
const RB = [144, 632]; // row background origin of item 1 (all rows share x and height)
const rel = (name, rowTop) => {
  const [x0, y0, x1, y1] = man(name);
  return rect(x0 - 144, y0 - rowTop, x1 - x0, y1 - y0);
};
const PACK_ICON = { coins_giant: ['pack-giant', 632], coins_large: ['pack-wild', 917], coins_medium: ['pack-happy', 1202] };

function Row({ i, blue, children }) {
  return (
    <div className="prow" style={{ top: k(ROW0 + i * PITCH), width: k(1152), height: k(268), left: k(87) }}>
      <img className="v5pic" alt="" draggable="false" src={`${ART}v5/row-${blue ? 'blue' : 'pink'}.webp`} style={rect(0, 0, 1152, 268)} />
      {children}
    </div>
  );
}

export default function CoinShop({ onBack }) {
  const t = useT();
  const save = useSave();
  const [prices, setPrices] = useState({});
  const [gate, setGate] = useState(null);
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
  const store = billing.available();
  const pay = async (id) => {
    setGate(null);
    setBusy(true);
    const ok = await billing.buy(id);
    setBusy(false);
    say(ok ? t('thanks') : t('purchaseFailed'));
    if (ok) sfx.win();
  };
  const video = async () => {
    if (!ads.rewardedAvailable()) return say(t('noVideo'));
    if (await ads.rewarded()) {
      addCoins(VIDEO_COINS);
      sfx.win();
      say('+' + t.n(VIDEO_COINS));
    }
  };
  const gift = () => {
    if (claimGift()) {
      sfx.win();
      say('+' + t.n(DAILY_GIFT_COINS));
    }
  };
  const ready = giftReady(save);
  const rows = COIN_PACKS.length + 1;
  const txtCol = (blue) => ({ name: blue ? '#fff' : '#1f5662', amount: blue ? '#ff9cc6' : '#ff4f86' });
  return (
    <>
    <Popup dw={1418} dh={2180} o={O} bg="coins-popup" close={[1226, 488, 1362, 631]} onClose={onBack}>
      <PandaPeek skin={save.pandaSkin} cx={727 - O[0]} by={345 - O[1]} />
      <Ribbon x={727 - O[0]} y={400 - O[1]}>
        {t('coinsShop')}
      </Ribbon>

      {/* header chips: free video coins + balance */}
      <Pic name="chip-free" o={O} />
      <button style={box('chip-free', O)} onClick={video} aria-label={t('freeCoins')} />
      <div className="ptxt" style={{ ...rect(444 - O[0], 497 - O[1], 130, 44), ...fs(40), color: '#ff4f86' }}>
        +{t.n(VIDEO_COINS)}
      </div>
      <div className="ptxt" style={{ ...rect(384 - O[0], 541 - O[1], 190, 34), ...fs(23), color: '#2c7f95' }}>
        {t('freeCoins')}
      </div>
      <Pic name="chip-coins" o={O} />
      <div className="ptxt" style={{ ...rect(915 - O[0], 506 - O[1], 215, 52), ...fs(46) }}>
        {t.n(save.coins)}
      </div>

      <div className="pop-list" style={rect(LIST[0] - O[0], LIST[1] - O[1], LIST[2] - LIST[0], LIST[3] - LIST[1])}>
        <div style={{ position: 'relative', height: k(ROW0 + rows * PITCH) }}>
          {COIN_PACKS.map((p, i) => {
            const blue = i % 2 === 0;
            const c = txtCol(blue);
            const icon = PACK_ICON[p.id];
            const top = RB[1] + i * 0; // rows share relative geometry
            return (
              <Row key={p.id} i={i} blue={blue}>
                {icon ? (
                  <img className="v5pic" alt="" draggable="false" src={`${ART}v5/${icon[0]}.webp`} style={rel(icon[0], icon[1])} />
                ) : (
                  <img className="v5pic" alt="" draggable="false" src={`${ART}v5/pack-happy.webp`} style={rect(30, 96, 190, 160)} />
                )}
                <img className="v5pic" alt="" draggable="false" src={`${ART}v5/burst.webp`} style={rect(218, 52, 115, 115)} />
                <div className="ptxt" style={{ ...rect(218, 52, 115, 115), ...fs(27), color: '#1f5662', flexDirection: 'column', transform: 'rotate(-12deg)' }}>
                  <b style={fs(34)}>{t.n(p.extra)}%</b>
                  {t('extra')}
                </div>
                {p.tag && (
                  <>
                    <img className="v5pic" alt="" draggable="false" src={`${ART}v5/${p.tag === 'bestDeal' ? 'tag-pink' : 'tag-green'}.webp`} style={rect(-76, p.tag === 'bestDeal' ? -3 : -3, 193, 273)} />
                    <div className="ptxt" style={{ ...rect(-77, 89, 170, 120), ...fs(36), color: '#fff', transform: 'rotate(28deg)', whiteSpace: 'normal', textShadow: '0 2px 0 rgba(0,0,0,.25)' }}>
                      {t(p.tag)}
                    </div>
                  </>
                )}
                <div className="ptxt" style={{ ...rect(380, 40, 300, 54), ...fs(46), color: c.name }}>{t(p.name)}</div>
                <div className="ptxt" style={{ ...rect(350, 100, 330, 60), ...fs(56), color: c.amount }}>+{t.n(p.coins)}</div>
                <div className="ptxt" style={{ ...rect(350, 178, 330, 44), ...fs(32), color: blue ? '#ffe07a' : '#e8a400' }}>
                  <img className="pcoin" alt="" src={`${ART}v5/coin-pink.webp`} />+{t.n(packBonus(p))} {t('bonus')}
                </div>
                <button className="pbtn" disabled={!store || busy} style={rect(772, 81, 334, 141)} onClick={() => setGate(p.id)}>
                  <img className="v5pic" alt="" draggable="false" src={`${ART}v5/btn-${blue ? 'orange' : 'pink'}.webp`} style={rect(0, 0, 334, 141)} />
                  <span style={{ ...rect(0, 0, 334, 128), display: 'grid', placeItems: 'center', ...fs(48) }}>{prices[p.id] || '—'}</span>
                </button>
              </Row>
            );
          })}
          {/* daily gift */}
          <Row i={COIN_PACKS.length} blue>
            <img className="v5pic" alt="" draggable="false" src={`${ART}v5/pack-free.webp`} style={rel('pack-free', 1772)} />
            <div className="ptxt" style={{ ...rect(350, 40, 330, 54), ...fs(46), color: '#fff' }}>{t('dailyGift')}</div>
            <div className="ptxt" style={{ ...rect(350, 110, 330, 70), ...fs(60), color: '#ff9cc6' }}>+{t.n(DAILY_GIFT_COINS)}</div>
            <button className="pbtn" disabled={!ready} style={rect(772, 81, 334, 141)} onClick={gift}>
              <img className="v5pic" alt="" draggable="false" src={`${ART}v5/btn-yellow.webp`} style={rect(0, 0, 334, 141)} />
              <span style={{ ...rect(0, 0, 334, 128), display: 'grid', placeItems: 'center', ...fs(52) }}>{ready ? t('free') : '✓'}</span>
            </button>
          </Row>
        </div>
      </div>
      {!store && <div className="ptxt" style={{ ...rect(150, 560 - 10 + 0, 1100, 0) }} />}
      {note && <div className="pop-toast" style={{ top: k(700) }}>{note}</div>}
    </Popup>
    {gate && <ParentGate onPass={() => pay(gate)} onCancel={() => setGate(null)} />}
    </>
  );
}
