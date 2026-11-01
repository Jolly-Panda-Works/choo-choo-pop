import { useEffect, useState } from 'react';
import { Popup, Ribbon, Pic, rect, k, fs, box } from '../ui/v5.jsx';
import { useT } from '../i18n.js';
import { useSave, claimMission, refreshMissions } from '../store.js';
import { MISSION_ART, ART } from '../board/sprites.js';
import { sfx } from '../audio.js';

const O = [10, 70];
const PITCH = 285;
const EMOJI = { dVisit: '📅', dLevels: '🚂', dStars: '⭐', dPerfect: '🏆', dNoHint: '🧠', dNoMistake: '🎯', dCoins: '🪙', dPower: '✨', wLevels: '🚆', wStars: '🌟', wPerfect: '👑', wDays: '🗓️', wNoHint: '💡', wNoMistake: '🎯', wCoins: '💰', wPower: '🔮' };

function MIcon({ kind }) {
  const [bad, setBad] = useState(false);
  return bad ? (
    <span style={{ fontSize: k(120) }}>{EMOJI[kind] || '⭐'}</span>
  ) : (
    <img className="v5pic" alt="" draggable="false" src={`${MISSION_ART}${kind}.webp`} onError={() => setBad(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
  );
}

const giftIcon = (r) => (r.hints ? `💡${r.hints}` : r.powerup ? (r.powerup === 'star' ? '⭐1' : r.powerup === 'eraser' ? '🧽1' : '👁1') : '');

export default function Missions({ onBack }) {
  const t = useT();
  const save = useSave();
  const [tab, setTab] = useState('daily');
  const [note, setNote] = useState('');
  useEffect(() => refreshMissions(), []);
  const list = save.mis?.[tab === 'daily' ? 'daily' : 'weekly'] || [];
  const order = (x) => (x.claimed ? 2 : x.p >= x.target ? 0 : 1);
  const sorted = [...list].sort((a, b) => order(a) - order(b));
  const done = list.filter((x) => x.claimed).length;
  const pct = list.length ? done / list.length : 0;
  const claim = (x) => {
    const r = claimMission(tab === 'daily' ? 'daily' : 'weekly', x.id);
    if (r) {
      sfx.win();
      setNote('+' + t.n(r.coins) + ' ' + giftIcon(r));
      setTimeout(() => setNote(''), 2200);
    }
  };
  return (
    <Popup dw={1435} dh={2105} o={O} bg="missions-popup" close={[1229, 472, 1365, 615]} onClose={onBack}>
      <Ribbon x={715 - O[0]} y={385 - O[1]}>
        {t('missions')}
      </Ribbon>
      <Pic name="top-track" o={O} />
      {pct > 0 && <img className="v5pic" alt="" draggable="false" src={`${ART}v5/top-fill.webp`} style={rect(492 - O[0], 488 - O[1], Math.max(80, 674 * pct), 82)} />}
      <Pic name="gem" o={O} />
      <div className="ptxt" style={{ ...rect(268 - O[0], 491 - O[1], 160, 63), ...fs(58), color: '#fff7b0', textShadow: '0 3px 0 #b48a00' }}>
        {t.n(done)}/{t.n(list.length)}
      </div>

      <div className="tabs" style={rect(190 - O[0], 614 - O[1], 1060, 92)}>
        {['daily', 'weekly'].map((id) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => (sfx.click(), setTab(id))}>
            {t(id)}
          </button>
        ))}
      </div>

      <div className="pop-list" style={rect(108 - O[0], 722 - O[1], 1213, 1335)}>
        <div style={{ position: 'relative', height: k(10 + sorted.length * PITCH + 20) }}>
          {sorted.map((x, i) => {
            const ready = x.p >= x.target && !x.claimed;
            const p = x.p / x.target;
            const pc = Math.round(p * 100);
            return (
              <div key={x.id} className="prow" style={{ top: k(10 + i * PITCH), left: k(28), width: k(1152), height: k(268) }}>
                <img className="v5pic" alt="" draggable="false" src={`${ART}v5/${x.claimed ? 'm-row-done' : 'm-row'}.webp`} style={rect(0, 0, 1152, 268)} />
                <img className="v5pic" alt="" draggable="false" src={`${ART}v5/bubble.webp`} style={rect(16, 13, 265, 241)} />
                <div className="ptxt" style={rect(66, 48, 165, 160)}>
                  <MIcon kind={x.kind} />
                </div>
                <div className="ptxt" style={{ ...rect(330, 28, 530, 62), ...fs(52), color: '#fff', justifyContent: 'flex-start' }}>{t('m_' + x.kind + '_t')}</div>
                <div className="ptxt" style={{ ...rect(330, 96, 530, 54), ...fs(34), color: '#8fe3ff', justifyContent: 'flex-start', whiteSpace: 'normal', textAlign: 'start' }}>
                  {t('m_' + x.kind + '_d', { n: t.n(x.target) })}
                </div>
                <div className="ptxt" style={{ ...rect(330, 176, 130, 50), ...fs(36), color: x.claimed || ready ? '#fff7b0' : '#ffb3c9' }}>{t.n(pc)}%</div>
                <img className="v5pic" alt="" draggable="false" src={`${ART}v5/bar-track.webp`} style={rect(459, 157, 263, 82)} />
                {p > 0 && <div className={'prog-fill ' + (p >= 1 ? 'green' : 'pink')} style={rect(475, 166, Math.max(50, 231 * p), 62)} />}
                {ready ? (
                  <button className="pbtn" style={rect(895, 66, 235, 112)} onClick={() => claim(x)}>
                    <img className="v5pic" alt="" draggable="false" src={`${ART}v5/btn-orange.webp`} style={rect(0, 0, 235, 112)} />
                    <span style={{ ...rect(0, 0, 235, 100), display: 'grid', placeItems: 'center', ...fs(44) }}>{t('claimReward')}</span>
                  </button>
                ) : (
                  <>
                    <img className="v5pic" alt="" draggable="false" src={`${ART}v5/coin-gold-big.webp`} style={{ ...rect(950, 52, 82, 84), opacity: x.claimed ? 0.45 : 1 }} />
                    <div className="ptxt" style={{ ...rect(880, 140, 222, 46), ...fs(34), color: x.claimed ? '#8aa6b3' : '#fff' }}>
                      {t('bonus')}: +{t.n(x.reward.coins)}
                    </div>
                    {giftIcon(x.reward) && <div className="ptxt" style={{ ...rect(880, 192, 222, 44), ...fs(32), color: x.claimed ? '#8aa6b3' : '#ffe07a' }}>+ {giftIcon(x.reward).replace(/\d+/, (d) => t.n(d))}</div>}
                  </>
                )}
                {x.claimed && (
                  <>
                    <img className="v5pic" alt="" draggable="false" src={`${ART}v5/tag-done.webp`} style={rect(-15, -18, 202, 192)} />
                    <div className="ptxt" style={{ ...rect(-4, 18, 140, 70), ...fs(34), color: '#fff', transform: 'rotate(-38deg)' }}>{t('done')}</div>
                    <img className="v5pic" alt="" draggable="false" src={`${ART}v5/tick.webp`} style={rect(998, 60, 95, 81)} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {note && <div className="pop-toast" style={{ top: k(760) }}>{note}</div>}
    </Popup>
  );
}
