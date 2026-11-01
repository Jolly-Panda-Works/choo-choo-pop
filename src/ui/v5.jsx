import { useEffect } from 'react';
import { sfx } from '../audio.js';
import M from './v5manifest.json';
import { V5_ART } from '../board/sprites.js';

// Popups of the v5 UI kit are laid out in the DESIGN pixels of the PSD mockups (1440 wide) and scaled with the popup width:
// inside <Popup> one design pixel = var(--k). All positions below are PSD coordinates minus the popup origin `o`.
export const k = (n) => `calc(var(--k) * ${n})`;
export const rect = (x, y, w, h) => ({ position: 'absolute', left: k(x), top: k(y), width: k(w), height: k(h) });
/** Like `rect`, measured from the reading start, so list rows mirror in Persian. */
export const rowRect = (x, y, w, h) => ({ position: 'absolute', insetInlineStart: k(x), top: k(y), width: k(w), height: k(h) });
export const man = (name) => M[name];
/** Box of a cut-out asset, optionally relative to an origin (abs PSD coordinates). */
export const box = (name, o = [0, 0]) => {
  const [x0, y0, x1, y1] = M[name];
  return rect(x0 - o[0], y0 - o[1], x1 - x0, y1 - y0);
};
export const Pic = ({ name, o, style, className = '', ...rest }) => (
  <img className={'v5pic ' + className} src={`${V5_ART}${name}.webp`} alt="" draggable="false" style={{ ...(o ? box(name, o) : null), ...style }} {...rest} />
);
export const fs = (n) => ({ fontSize: k(n) });

/**
 * Centered popup, scaled to fit width AND height.  dw/dh = design size of the whole box, bg = {name, x, y, w, h}.
 * closeAbs = [x0,y0,x1,y1] of the close button in the mockup (the art already contains the X) in the same coordinates as `o`.
 */
export function Popup({ dw, dh, o, bg, close, onClose, children, className = '', quiet = false }) {
  useEffect(() => {
    if (!quiet) sfx.open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="pop-back">
      <div className={'pop ' + className} style={{ '--dw': dw, '--ar': dw / dh }}>
        <div className="pop-in" style={{ '--dw': dw }}>
          <img className="v5pic" src={`${V5_ART}${bg}.webp`} alt="" draggable="false" style={rect(0, 0, dw, dh)} />
          {children}
          {onClose && <button className="pop-x" aria-label="close" onClick={() => (sfx.close(), onClose())} style={rect(close[0] - o[0], close[1] - o[1], close[2] - close[0], close[3] - close[1])} />}
        </div>
      </div>
    </div>
  );
}

export const Ribbon = ({ x, y, w = 560, shadow, children }) => (
  <div className="pop-title" style={{ ...rect(x - w / 2, y - 50, w, 100), fontSize: k(80), '--title-shadow': shadow }}>
    {children}
  </div>
);
