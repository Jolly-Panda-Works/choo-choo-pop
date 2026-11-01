import { useMemo } from 'react';
import { useT } from '../i18n.js';
import Modal from './Modal.jsx';

/** Simple grown-up check before real-money purchases (required for kids' apps). */
export default function ParentGate({ onPass, onCancel }) {
  const t = useT();
  const q = useMemo(() => {
    const a = 6 + Math.floor(Math.random() * 4);
    const b = 4 + Math.floor(Math.random() * 5);
    const right = a * b;
    const set = new Set([right]);
    while (set.size < 3) set.add(right + (Math.floor(Math.random() * 9) - 4 || 5));
    return { a, b, right, options: [...set].sort(() => Math.random() - 0.5) };
  }, []);
  return (
    <Modal pose="salute" title={t('gateTitle')} onClose={onCancel}>
      {(leave) => (
        <>
          <p className="small">{t('gateText')}</p>
          <p className="gate-q">
            {t.n(q.a)} × {t.n(q.b)} = ?
          </p>
          <div className="modal-actions">
            {q.options.map((o) => (
              <button key={o} className="btn big blue" onClick={() => leave(o === q.right ? onPass : onCancel)}>
                {t.n(o)}
              </button>
            ))}
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => leave(onCancel)}>
              {t('cancel')}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
