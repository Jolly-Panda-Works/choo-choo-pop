import { useEffect, useRef, useState } from 'react';
import { rowRect, k, fs } from '../ui/v5.jsx';
import BluePopup, { LIST, ROW_X, inPopup, RowBg, rowLook, tabColors } from '../ui/BluePopup.jsx';
import PopList from '../ui/PopList.jsx';
import { useT } from '../i18n.js';
import { useSave, claimMission, refreshMissions } from '../store.js';
import { earnedReward } from '../game/missions.js';
import { MISSION_ART, ART } from '../board/sprites.js';
import { sfx } from '../audio.js';

const ROW_H = 330;
const PITCH = 348;
const TABS_Y = 530;
const LIST_Y = 634;
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
  const timer = useRef();
  useEffect(() => {
    refreshMissions();
    return () => clearTimeout(timer.current);
  }, []);
  const say = (m) => {
    setNote(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(''), 2200);
  };
  const list = save.mis?.[tab === 'daily' ? 'daily' : 'weekly'] || [];
  const order = (x) => (x.claimed ? 2 : x.p >= x.target ? 0 : 1);
  const sorted = [...list].sort((a, b) => order(a) - order(b));
  const claim = (x) => {
    const r = claimMission(tab === 'daily' ? 'daily' : 'weekly', x.id);
    if (r) {
      sfx.coins();
      say('+' + t.n(r.coins) + ' ' + giftIcon(r));
    }
  };
  return (
    <BluePopup frame="missions" title={t('missions')} onClose={onBack}>
      <div className="tabs" style={{ ...inPopup(190, TABS_Y, 1040, 88), ...tabColors('missions') }}>
        {['daily', 'weekly'].map((id) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => (sfx.click(), setTab(id))}>
            {t(id)}
          </button>
        ))}
      </div>

      <PopList key={tab} style={inPopup(LIST[0], LIST_Y, LIST[2] - LIST[0], LIST[3] - LIST_Y)}>
        <div style={{ position: 'relative', height: k(10 + sorted.length * PITCH) }}>
          {sorted.map((x, i) => {
            const ready = x.p >= x.target && !x.claimed;
            const p = Math.min(1, x.p / x.target);
            const gift = giftIcon(earnedReward(x.reward, save.taught));
            const look = rowLook('missions', i);
            return (
              <div key={x.id} className="prow" style={{ top: k(10 + i * PITCH), left: k(ROW_X), width: k(1152), height: k(ROW_H) }}>
                <RowBg look={look} h={ROW_H} />
                <img className="v5pic" alt="" draggable="false" src={`${ART}v5/bubble.webp`} style={rowRect(16, 44, 265, 241)} />
                <div className="ptxt" style={rowRect(66, 80, 165, 160)}>
                  <MIcon kind={x.kind} />
                </div>
                <div className="ptxt" style={{ ...rowRect(300, 30, 510, 62), ...fs(48), color: look.ink, justifyContent: 'flex-start' }}>{t('m_' + x.kind + '_t')}</div>
                <div className="ptxt" style={{ ...rowRect(300, 100, 510, 96), ...fs(34), color: look.sub, justifyContent: 'flex-start', whiteSpace: 'normal', textAlign: 'start' }}>
                  {t('m_' + x.kind + '_d', { n: t.n(x.target) })}
                </div>
                <div className={'mbar' + (p >= 1 ? ' full' : '')} style={rowRect(300, 214, 510, 66)}>
                  <i style={{ width: `${p * 100}%` }} />
                  <span>
                    {t.n(Math.min(x.p, x.target))}/{t.n(x.target)}
                  </span>
                </div>
                <div className="ptxt" style={{ ...rowRect(835, 40, 280, 62), ...fs(44), color: look.ink, opacity: x.claimed ? 0.6 : 1, gap: k(10) }}>
                  <img alt="" draggable="false" src={`${ART}v5/coin-gold.webp`} style={{ width: k(56), height: k(56) }} />+{t.n(x.reward.coins)}
                </div>
                {gift && <div className="ptxt" style={{ ...rowRect(835, 106, 280, 44), ...fs(32), color: look.amount, opacity: x.claimed ? 0.6 : 1 }}>+ {gift.replace(/\d+/, (d) => t.n(d))}</div>}
                {x.claimed ? (
                  <img className="v5pic" alt="" draggable="false" src={`${ART}v5/tick.webp`} style={rowRect(926, 170, 95, 81)} />
                ) : (
                  <button className="pbtn" disabled={!ready} style={{ ...rowRect(835, 158, 280, 124), opacity: ready ? 1 : 0.5 }} onClick={() => claim(x)}>
                    <img className="v5pic" alt="" draggable="false" src={`${ART}v5/btn-orange.webp`} style={rowRect(0, 0, 280, 124)} />
                    <span style={{ ...rowRect(0, 0, 280, 110), display: 'grid', placeItems: 'center', ...fs(44) }}>{t('claimReward')}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </PopList>
      {note && <div className="pop-toast" style={{ top: k(900) }}>{note}</div>}
    </BluePopup>
  );
}
