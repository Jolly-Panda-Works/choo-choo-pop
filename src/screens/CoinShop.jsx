import { useEffect, useRef, useState } from 'react';
import { rowRect, k, fs } from '../ui/v5.jsx';
import BluePopup, { LIST, ROW_X, inPopup, RowBg, rowLook } from '../ui/BluePopup.jsx';
import PopList from '../ui/PopList.jsx';
import { Icon } from '../ui/icons.jsx';
import ParentGate from '../ui/ParentGate.jsx';
import { useT } from '../i18n.js';
import { useSave } from '../store.js';
import { COIN_PACKS, packBonus, REMOVE_ADS_ID } from '../config.js';
import { billing } from '../services/billing.js';
import { ART } from '../board/sprites.js';
import { sfx } from '../audio.js';

const ROW0 = 21; // first row below the top of the list window
const PITCH = 285;
const PACK_ICON = { coins_giant: 'coin-mountain', coins_large: 'coin-sack', coins_medium: 'coin-tub', coins_small: 'coins-few' };
const PACK_BOX = { ...rowRect(26, 34, 200, 200), objectFit: 'contain' };

function Row({ i, look, children }) {
  return (
    <div className="prow" style={{ top: k(ROW0 + i * PITCH), width: k(1152), height: k(268), left: k(ROW_X) }}>
      <RowBg look={look} />
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
    if (ok) sfx.coins();
  };
  const rows = COIN_PACKS.length + 1;
  return (
    <>
    <BluePopup frame="coins" title={t('coinsShop')} onClose={onBack}>
      <PopList style={inPopup(LIST[0], LIST[1], LIST[2] - LIST[0], LIST[3] - LIST[1])}>
        <div style={{ position: 'relative', height: k(ROW0 + rows * PITCH) }}>
          {COIN_PACKS.map((p, i) => {
            const look = rowLook('coins', i);
            const icon = PACK_ICON[p.id];
            return (
              <Row key={p.id} i={i} look={look}>
                <img className="v5pic" alt="" draggable="false" src={`${ART}v5/${icon}.webp`} style={PACK_BOX} />
                <img className="v5pic" alt="" draggable="false" src={`${ART}v5/burst.webp`} style={rowRect(218, 52, 115, 115)} />
                <div className="ptxt" style={{ ...rowRect(218, 52, 115, 115), ...fs(27), color: '#1f5662', flexDirection: 'column', transform: 'rotate(-12deg)' }}>
                  <b style={fs(34)}>{t.n(p.extra)}%</b>
                  {t('extra')}
                </div>
                {p.tag && (
                  <>
                    <img className="v5pic row-tag" alt="" draggable="false" src={`${ART}v5/${p.tag === 'bestDeal' ? 'tag-pink' : 'tag-green'}.webp`} style={rowRect(-76, p.tag === 'bestDeal' ? -3 : -3, 193, 273)} />
                    <div className="ptxt row-tag-text" style={{ ...rowRect(-77, 89, 170, 120), ...fs(36), color: '#fff', whiteSpace: 'normal', textShadow: '0 2px 0 rgba(0,0,0,.25)' }}>
                      {t(p.tag)}
                    </div>
                  </>
                )}
                <div className="ptxt" style={{ ...rowRect(380, 40, 300, 54), ...fs(46), color: look.ink }}>{t(p.name)}</div>
                <div className="ptxt" style={{ ...rowRect(350, 100, 330, 60), ...fs(56), color: look.amount }}>+{t.n(p.coins)}</div>
                <div className="ptxt" style={{ ...rowRect(350, 178, 330, 44), ...fs(32), color: look.amount }}>
                  <img className="pcoin" alt="" src={`${ART}v5/coin-gold.webp`} />+{t.n(packBonus(p))} {t('bonus')}
                </div>
                <button className="pbtn" disabled={!store || busy} style={rowRect(772, 81, 334, 141)} onClick={() => setGate(p.id)}>
                  <img className="v5pic" alt="" draggable="false" src={`${ART}v5/btn-${look.btn}.webp`} style={rowRect(0, 0, 334, 141)} />
                  <span style={{ ...rowRect(0, 0, 334, 128), display: 'grid', placeItems: 'center', ...fs(48) }}>{prices[p.id] || '—'}</span>
                </button>
              </Row>
            );
          })}
          {/* remove ads */}
          <Row i={COIN_PACKS.length} look={rowLook('coins', COIN_PACKS.length)}>
            <img className="v5pic" alt="" draggable="false" src={`${ART}v5/no-ads.webp`} style={PACK_BOX} />
            <div className="ptxt" style={{ ...rowRect(300, 44, 450, 64), ...fs(46), color: rowLook('coins', COIN_PACKS.length).ink }}>{t('removeAds')}</div>
            <div className="ptxt" style={{ ...rowRect(300, 116, 450, 110), ...fs(32), color: rowLook('coins', COIN_PACKS.length).sub, whiteSpace: 'normal' }}>{save.adsRemoved ? t('adsRemoved') : t('removeAdsInfo')}</div>
            <button className="pbtn" disabled={!store || busy || save.adsRemoved} style={rowRect(772, 81, 334, 141)} onClick={() => setGate(REMOVE_ADS_ID)}>
              <img className="v5pic" alt="" draggable="false" src={`${ART}v5/btn-orange.webp`} style={rowRect(0, 0, 334, 141)} />
              <span style={{ ...rowRect(0, 0, 334, 128), display: 'grid', placeItems: 'center', ...fs(48) }}>{save.adsRemoved ? <Icon name="tick" /> : prices[REMOVE_ADS_ID] || '—'}</span>
            </button>
          </Row>
        </div>
      </PopList>
      {!store && <div className="ptxt" style={{ ...rowRect(150, 560 - 10 + 0, 1100, 0) }} />}
      {note && <div className="pop-toast" style={{ top: k(900) }}>{note}</div>}
    </BluePopup>
    {gate && <ParentGate onPass={() => pay(gate)} onCancel={() => setGate(null)} />}
    </>
  );
}
