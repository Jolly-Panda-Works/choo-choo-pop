import { useEffect, useRef, useState } from 'react';
import { useSave, update } from '../store.js';
import { useT } from '../i18n.js';
import { usePlatformLinks, usePlatformRows } from '../services/platform.jsx';
import { APP_VERSION, CREDITS } from '../config.js';
import { UI_ART, ART } from '../board/sprites.js';
import { rowRect, k, fs } from '../ui/v5.jsx';
import BluePopup, { LIST, ROW_X, inPopup, RowBg, rowLook } from '../ui/BluePopup.jsx';
import PopList from '../ui/PopList.jsx';
import { Icon } from '../ui/icons.jsx';
import Modal from '../ui/Modal.jsx';
import { sfx } from '../audio.js';

const PITCH = 285;
const ROW0 = 21;

function About({ onClose }) {
  const t = useT();
  const links = usePlatformLinks(t);
  return (
    <Modal pose="salute" title={t('about')} onClose={onClose}>
      <p className="small">
        {t('title')} · {t('version')} {t.n(APP_VERSION)}
      </p>
      <p className="small">
        {t('gameBy')} {CREDITS.author}
      </p>
      <div className="modal-actions about-links">
        <button className="btn" onClick={() => window.open(CREDITS.website, '_blank')}>
          {t('website')}
        </button>
        {links.map((l) => (
          <button key={l.key} className="btn" onClick={l.run}>
            {l.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}

export default function Settings({ onBack, onStory, onLang }) {
  const save = useSave();
  const t = useT();
  const [about, setAbout] = useState(false);
  const [note, setNote] = useState('');
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const say = (m) => {
    setNote(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(''), 2300);
  };
  const platformRows = usePlatformRows(t, say);

  // one entry per row: toggle rows have `on` + `set`, action rows have `btn` {label, run}
  const rows = [
    { key: 'sound', icon: 'sound', name: t('sound'), on: save.sound, set: (v) => update({ sound: v }) },
    { key: 'music', icon: 'music', name: t('music'), on: save.music, set: (v) => update({ music: v }) },
    { key: 'vibrate', icon: 'alert', name: t('vibration'), on: save.vibrate, set: (v) => update({ vibrate: v }) },
    { key: 'language', name: t('language'), btn: { label: t.lang === 'fa' ? 'English' : 'فارسی', run: onLang } },
    { key: 'story', name: t('replayStory'), btn: { label: <Icon name="repeat" />, run: onStory } },
  ];
  rows.push(...platformRows);
  rows.push({ key: 'about', name: t('about'), btn: { label: <Icon name="info" />, run: () => setAbout(true) } });

  return (
    <>
      <BluePopup frame="settings" title={t('settings')} onClose={onBack}>
        <PopList style={inPopup(LIST[0], LIST[1], LIST[2] - LIST[0], LIST[3] - LIST[1])}>
          <div style={{ position: 'relative', height: k(ROW0 + rows.length * PITCH) }}>
            {rows.map((r, i) => {
              const look = rowLook('settings', i);
              return (
                <div key={r.key} className="prow" style={{ top: k(ROW0 + i * PITCH), left: k(ROW_X), width: k(1152), height: k(268) }}>
                  <RowBg look={look} />
                  {r.icon && (
                    <div className="ptxt" style={rowRect(24, 24, 240, 220)}>
                      <img src={`${UI_ART}${r.icon}-${r.on ? 'enabled' : 'disabled'}.webp`} alt="" draggable="false" style={{ height: '58%', width: 'auto' }} />
                    </div>
                  )}
                  <div
                    className="ptxt"
                    style={{ ...rowRect(r.icon ? 300 : 60, 54, r.icon ? 470 : 710, 160), ...fs(r.name.length > 20 ? 40 : 50), color: look.ink, justifyContent: 'flex-start', whiteSpace: 'normal', textAlign: 'start' }}
                  >
                    {r.name}
                  </div>
                  {r.set ? (
                    <button
                      className={'pswitch' + (r.on ? ' on' : '')}
                      role="switch"
                      aria-checked={r.on}
                      aria-label={r.name}
                      style={rowRect(850, 112, 190, 44)}
                      onClick={() => {
                        r.set(!r.on);
                        sfx.click();
                      }}
                    />
                  ) : (
                    <button className="pbtn" style={rowRect(790, 66, 302, 129)} onClick={r.btn.run}>
                      <img className="v5pic" alt="" draggable="false" src={`${ART}v5/sbtn-${look.btn}.webp`} style={rowRect(0, 0, 302, 129)} />
                      <span style={{ ...rowRect(0, 0, 302, 118), display: 'flex', alignItems: 'center', justifyContent: 'center', ...fs(r.btn.label.length > 2 ? 40 : 54) }}>{r.btn.label}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </PopList>
        {note && <div className="pop-toast" style={{ top: k(900) }}>{note}</div>}
      </BluePopup>
      {about && <About onClose={() => setAbout(false)} />}
    </>
  );
}
