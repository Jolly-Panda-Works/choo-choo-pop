import Panda from './Panda.jsx';
import { useSave } from '../store.js';

/** Popup with the panda sitting on its top edge. */
export default function Modal({ pose, title, children, wide = false, onClose }) {
  const save = useSave();
  return (
    <div className="modal-back" onClick={onClose}>
      <div className={'modal' + (pose ? ' has-panda' : '') + (wide ? ' wide' : '')} onClick={(e) => e.stopPropagation()}>
        {pose && <Panda pose={pose} skin={save.pandaSkin} size={104} className="modal-panda" />}
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
  );
}
