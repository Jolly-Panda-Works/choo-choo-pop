import { useEffect, useRef, useState } from 'react';
import { rowRect, k, fs } from '../ui/v5.jsx';
import BluePopup, { LIST, ROW_X, inPopup, RowBg, rowLook } from '../ui/BluePopup.jsx';
import PopList from '../ui/PopList.jsx';
import { PowerIcon, Bulb } from '../ui/icons.jsx';
import { useSave, buyHintPack, addHints, buyPowerup } from '../store.js';
import { useT } from '../i18n.js';
import { HINT_PACKS, POWERUPS, POWERUP_PACK } from '../config.js';
import { ads } from '../services/ads.js';
import { ART } from '../board/sprites.js';
import { sfx } from '../audio.js';

const PITCH = 285;
const ROW0 = 21;

export default function Shop({ onBack }) {
  const save = useSave();
  const t = useT();
  const [note, setNote] = useState('');
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const say = (m) => {
    setNote(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(''), 2300);
  };
  const noCoins = () => {
    sfx.error();
    say(t('notEnoughCoins'));
  };

  // one entry per row: { key, icon, name, info, btn: {label, coin?, real?, on?, disabled?, run} }
  const rows = [];
  if (ads.rewardedAvailable())
    rows.push({ key: 'vid', icon: <img src={`${ART}v5/icon-free-hint.webp`} alt="" draggable="false" style={{ width: '76%', height: '76%', objectFit: 'contain' }} />, count: 1, name: t('freeHint'), info: t('watchShort'), btn: { label: t('free'), run: async () => ((await ads.rewarded()) && (addHints(1), say(t('gotHint')))) } });
  for (const p of POWERUPS)
    rows.push({
      key: 'pw' + p.id,
      icon: <PowerIcon id={p.id} size="72%" />,
      count: POWERUP_PACK,
      name: t('pw_' + p.id),
      info: t('pwi_' + p.id),
      btn: { label: t.n(p.price * POWERUP_PACK), coin: true, run: () => (buyPowerup(p.id) ? (sfx.coins(), say(t('bought'))) : noCoins()) },
    });
  for (const h of HINT_PACKS)
    rows.push({
      key: h.id,
      icon: <Bulb size="72%" />,
      count: h.hints,
      name: t(h.id === 'hints_small' ? 'smallPack' : 'bigPack'),
      info: t('hintsCount', { n: t.n(h.hints) }),
      btn: { label: t.n(h.price), coin: true, run: () => (buyHintPack(h) ? (sfx.coins(), say(t('bought'))) : noCoins()) },
    });
  return (
    <>
      <BluePopup frame="shop" title={t('shop')} onClose={onBack}>
        <PopList style={inPopup(LIST[0], LIST[1], LIST[2] - LIST[0], LIST[3] - LIST[1])}>
          <div style={{ position: 'relative', height: k(ROW0 + rows.length * PITCH) }}>
            {rows.map((r, i) => {
              const look = rowLook('shop', i);
              return (
                <div key={r.key} className="prow" style={{ top: k(ROW0 + i * PITCH), left: k(ROW_X), width: k(1152), height: k(268) }}>
                  <RowBg look={look} />
                  <div className="ptxt" style={rowRect(24, 24, 240, 220)}>{r.icon}</div>
                  {r.count != null && (
                    <span className="ptxt count-badge" style={{ ...rowRect(190, 160, 92, 92), ...fs(40) }}>
                      {t.n(r.count)}
                    </span>
                  )}
                  <div className="ptxt" style={{ ...rowRect(300, 36, 470, 70), ...fs(r.name.length > 20 ? 38 : 48), color: look.ink, justifyContent: 'flex-start' }}>{r.name}</div>
                  <div className="ptxt" style={{ ...rowRect(300, 112, 470, 120), ...fs(34), color: look.sub, justifyContent: 'flex-start', whiteSpace: 'normal', textAlign: 'start' }}>{r.info}</div>
                  <button className="pbtn" style={rowRect(790, 66, 302, 129)} onClick={r.btn.run}>
                    <img className="v5pic" alt="" draggable="false" src={`${ART}v5/sbtn-${look.btn}.webp`} style={rowRect(0, 0, 302, 129)} />
                    <span style={{ ...rowRect(0, 0, 302, 118), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: k(8), ...fs(r.btn.label.length > 7 ? 34 : 46) }}>
                      {r.btn.coin && <img className="pcoin" alt="" src={`${ART}v5/coin-gold.webp`} />}
                      {r.btn.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </PopList>
        {note && <div className="pop-toast" style={{ top: k(900) }}>{note}</div>}
      </BluePopup>
    </>
  );
}
