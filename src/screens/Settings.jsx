import { useEffect, useRef, useState } from 'react';
import { useSave, update, resetProgress } from '../store.js';
import { useT } from '../i18n.js';
import { billing } from '../services/billing.js';
import { UI_ART, ART } from '../board/sprites.js';
import { Popup, PandaPeek, Ribbon, rect, k, fs } from '../ui/v5.jsx';
import Modal from '../ui/Modal.jsx';
import { sfx } from '../audio.js';

// same popup frame / row layout as the shop (design px of the shop mockup)
const O = [60, 90];
const PITCH = 285;
const ROW0 = 21;
const LIST = [118, 600, 1331, 2060];

export default function Settings({ onBack, onStory }) {
  const save = useSave();
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  const [note, setNote] = useState('');
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const say = (m) => {
    setNote(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(''), 2300);
  };

  // one entry per row: toggle rows have `on` + `set`, action rows have `btn` {label, run}
  const rows = [
    { key: 'sound', icon: 'sound', name: t('sound'), on: save.sound, set: (v) => update({ sound: v }) },
    { key: 'vibrate', icon: 'alert', name: t('vibration'), on: save.vibrate, set: (v) => update({ vibrate: v }) },
    { key: 'story', name: t('replayStory'), btn: { label: '\u25B6', run: onStory } },
  ];
  if (billing.available())
    rows.push({
      key: 'restore',
      name: t('restorePurchases'),
      btn: {
        label: '\u21BB',
        run: async () => {
          const n = await billing.restore();
          say(n > 0 ? t('restored') : t('nothingToRestore'));
        },
      },
    });
  rows.push({ key: 'reset', name: t('resetProgress'), danger: true, btn: { label: '\u2715', run: () => setConfirm(true) } });

  return (
    <>
      <Popup dw={1320} dh={2010} o={O} bg="shop-popup" close={[1222, 463, 1366, 614]} onClose={onBack}>
        <PandaPeek skin={save.pandaSkin} cx={731 - O[0]} by={345 - O[1]} />
        <Ribbon x={730 - O[0]} y={395 - O[1]}>
          {t('settings')}
        </Ribbon>

        <div className="pop-list" style={rect(LIST[0] - O[0], LIST[1] - O[1], LIST[2] - LIST[0], LIST[3] - LIST[1])}>
          <div style={{ position: 'relative', height: k(ROW0 + rows.length * PITCH) }}>
            {rows.map((r, i) => {
              const blue = i % 2 === 0;
              return (
                <div key={r.key} className="prow" style={{ top: k(ROW0 + i * PITCH), left: k(27), width: k(1152), height: k(268) }}>
                  <img className="v5pic" alt="" draggable="false" src={`${ART}v5/shop-row-${blue ? 'blue' : 'pink'}.webp`} style={rect(0, 0, 1152, 268)} />
                  {r.icon && (
                    <div className="ptxt" style={rect(24, 24, 240, 220)}>
                      <img src={`${UI_ART}${r.icon}-${r.on ? 'enabled' : 'disabled'}.webp`} alt="" draggable="false" style={{ height: '58%', width: 'auto' }} />
                    </div>
                  )}
                  <div
                    className="ptxt"
                    style={{ ...rect(r.icon ? 300 : 60, 54, r.icon ? 470 : 710, 160), ...fs(r.name.length > 20 ? 40 : 50), color: blue ? '#fff' : '#1f5662', justifyContent: 'flex-start', whiteSpace: 'normal', textAlign: 'start' }}
                  >
                    {r.name}
                  </div>
                  {r.set ? (
                    <button
                      className={'pswitch' + (r.on ? ' on' : '')}
                      role="switch"
                      aria-checked={r.on}
                      aria-label={r.name}
                      style={rect(850, 112, 190, 44)}
                      onClick={() => {
                        r.set(!r.on);
                        sfx.click();
                      }}
                    />
                  ) : (
                    <button className="pbtn" style={rect(790, 66, 302, 129)} onClick={r.btn.run}>
                      <img className="v5pic" alt="" draggable="false" src={`${ART}v5/sbtn-${r.danger || !blue ? 'pink' : 'orange'}.webp`} style={rect(0, 0, 302, 129)} />
                      <span style={{ ...rect(0, 0, 302, 118), display: 'flex', alignItems: 'center', justifyContent: 'center', ...fs(54) }}>{r.btn.label}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {note && <div className="pop-toast" style={{ top: k(700) }}>{note}</div>}
      </Popup>
      {confirm && (
        <Modal pose="salute" title={t('resetConfirm')} onClose={() => setConfirm(false)}>
          <p className="small">{t('resetKeeps')}</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setConfirm(false)}>
              {t('cancel')}
            </button>
            <button
              className="btn danger"
              onClick={() => {
                resetProgress();
                setConfirm(false);
              }}
            >
              {t('yes')}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
