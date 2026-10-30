import { useState } from 'react';
import { useSave, update } from '../store.js';
import { useT } from '../i18n.js';
import { START_HINTS } from '../config.js';

function Toggle({ label, on, onChange }) {
  return (
    <button className="row" onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span>{label}</span>
      <i className={'switch' + (on ? ' on' : '')} />
    </button>
  );
}

export default function Settings({ onBack }) {
  const save = useSave();
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  return (
    <main className="screen settings">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label={t('back')}>
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <h2>{t('settings')}</h2>
        <span />
      </header>
      <div className="panel">
        <Toggle label={t('sound')} on={save.sound} onChange={(v) => update({ sound: v })} />
        <Toggle label={t('vibration')} on={save.vibrate} onChange={(v) => update({ vibrate: v })} />
        <button className="btn danger" onClick={() => setConfirm(true)}>
          {t('resetProgress')}
        </button>
      </div>
      {confirm && (
        <div className="modal-back">
          <div className="modal">
            <h3>{t('resetConfirm')}</h3>
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirm(false)}>
                {t('cancel')}
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  update({ unlocked: 1, stars: {}, hints: START_HINTS });
                  setConfirm(false);
                }}
              >
                {t('yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
