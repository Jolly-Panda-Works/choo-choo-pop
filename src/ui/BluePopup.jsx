import { Popup, Ribbon, rect, k, fs } from './v5.jsx';
import { ART } from '../board/sprites.js';
import { useT } from '../i18n.js';

const O = [15, -245]; // PSD origin of the old popup inside our box: the contents sit under the title bar of the frames
const DW = 1418;
const DH = 2478;
// the frame art of each popup, and the shadow of its title
const FRAMES = { shop: '#b86f00', coins: '#4f2aa8', missions: '#17752f', custom: '#c81e66', spin: '#5a22ad', settings: '#0c5fb8' };
const ROW_COLORS = { shop: '#f0a020', coins: '#8a5fe0', missions: '#46b552', custom: '#f2649f', settings: '#2f8fe8' };
/** List rows take turns: the colour of the frame, then white. */
export const rowLook = (frame, i) => {
  const color = ROW_COLORS[frame];
  const on = i % 2 === 0;
  return {
    color: on ? color : '#fff',
    edge: color,
    ink: on ? '#fff' : FRAMES[frame],
    sub: on ? 'rgba(255, 255, 255, 0.9)' : FRAMES[frame],
    amount: on ? '#ffe07a' : FRAMES[frame],
    btn: on && frame === 'shop' ? 'pink' : 'orange',
  };
};
const TAB_COLORS = { missions: ['#b5e8ae', '#84cf7c'], custom: ['#fcb0c3', '#ee8fa8'] };
/** The colours of a frame for its `.tabs`. */
export const tabColors = (frame) => ({ '--tab': TAB_COLORS[frame][0], '--tab-edge': TAB_COLORS[frame][1], '--tab-d': FRAMES[frame] });
export const RowBg = ({ look, h = 268 }) => <div className="row-bg" style={{ ...rect(0, 0, 1152, h), background: look.color, borderColor: look.edge }} />;
/** List window of the blue popup (PSD coordinates); rows start `ROW_X` design px inside it. */
export const LIST = [57, 520, 1330, 2071];
export const ROW_X = 87;
export const inPopup = (x, y, w, h) => rect(x - O[0], y - O[1], w, h);

/** The panda frames of the big popups (`frame` picks the art): title, and the star balance when `stars` is given. */
export default function BluePopup({ frame, title, onClose, quiet, stars, children }) {
  const t = useT();
  return (
    <Popup dw={DW} dh={DH} o={O} bg={'frame-' + frame} close={[1250, 260, 1390, 400]} onClose={onClose} quiet={quiet}>
      <Ribbon x={DW / 2} y={605} w={900} shadow={FRAMES[frame]}>
        {title}
      </Ribbon>
      {stars != null && (
        <div className="ptxt star-chip" style={{ ...inPopup(552, 515, 350, 96), ...fs(52), gap: k(14) }} aria-label={t('stars')}>
          <img alt="" draggable="false" src={`${ART}map/ui/star-gold.webp`} style={{ width: k(70), height: k(70) }} />
          {t.n(stars)}
        </div>
      )}
      {children}
    </Popup>
  );
}
