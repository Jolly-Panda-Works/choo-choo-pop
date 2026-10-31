import { useState } from 'react';
import Panda from './Panda.jsx';
import { useSave } from '../store.js';
import { ua } from '../anim/ua.js';

/**
 * Popup with the panda standing on its top edge.
 * Opens / closes with the converted Unity clips popups-default-popup-open / -close and the fade-in of the win popup background.
 */
export default function Modal({ pose, title, children, wide = false, onClose, titleClass = '' }) {
  const save = useSave();
  const [closing, setClosing] = useState(false);
  const close = () => {
    if (!onClose || closing) return;
    setClosing(true);
    setTimeout(onClose, 300);
  };
  return (
    <div
      className={'modal-back ' + (closing ? ua('popups-full-screen-fullscreen-popup-close') : ua('win-popup-background-fade-in-background-animation'))}
      onClick={close}
    >
      <div
        className={'modal ' + (closing ? ua('popups-default-popup-close') : ua('popups-default-popup-open')) + (pose ? ' has-panda' : '') + (wide ? ' wide' : '')}
        onClick={(e) => e.stopPropagation()}
      >
        {pose && <Panda pose={pose} skin={save.pandaSkin} size={150} className="modal-panda" />}
        <div className="modal-body">
          {title && <h3 className={titleClass}>{title}</h3>}
          {children}
        </div>
      </div>
    </div>
  );
}
