import { useState } from 'react';
import { useSave, update, resetProgress } from '../store.js';
import { useT } from '../i18n.js';
import { billing } from '../services/billing.js';
import { BackIcon } from '../ui/icons.jsx';
import Modal from '../ui/Modal.jsx';

function Toggle({ label, on, onChange }) {
  return (
    <button className="row" onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span>{label}</span>
      <i className={'switch' + (on ? ' on' : '')} />
    </button>
  );
}

export default function Settings({ onBack, onStory }) {
  const save = useSave();
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  const [note, setNote] = useState('');
  return (
    <main className="screen settings">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label={t('back')}>
          <BackIcon />
        </button>
        <h2>{t('settings')}</h2>
        <span />
      </header>
      <div className="panel">
        <Toggle label={t('sound')} on={save.sound} onChange={(v) => update({ sound: v })} />
        <Toggle label={t('vibration')} on={save.vibrate} onChange={(v) => update({ vibrate: v })} />
        <button className="row" onClick={onStory}>
          <span>{t('replayStory')}</span>
          <span>▶</span>
        </button>
        {billing.available() && (
          <button
            className="row"
            onClick={async () => {
              const n = await billing.restore();
              setNote(n > 0 ? t('restored') : t('nothingToRestore'));
            }}
          >
            <span>{t('restorePurchases')}</span>
            <span>↻</span>
          </button>
        )}
        {note && <p className="small">{note}</p>}
        <button className="btn danger" onClick={() => setConfirm(true)}>
          {t('resetProgress')}
        </button>
      </div>
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
    </main>
  );
}
