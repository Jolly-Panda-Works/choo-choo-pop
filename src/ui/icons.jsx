import { ART, UI_ART, V5_ART } from '../board/sprites.js';
import { ua, uaDelay } from '../anim/ua.js';

// Shared gradients for the glossy icons (rendered once by <IconDefs /> in App.jsx).
export function IconDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <radialGradient id="g-coin" cx="35%" cy="28%" r="80%">
          <stop offset="0" stopColor="#fff6a8" />
          <stop offset="0.45" stopColor="#ffd93b" />
          <stop offset="1" stopColor="#f0a30a" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/** White icon (art/icons), as tall as the text around it. */
export const Icon = ({ name }) => <img className="gi" src={`${ART}icons/${name}.webp`} alt="" draggable="false" />;

export function Coin({ size = 22 }) {
  return <img className="coin-ico" src={`${V5_ART}coin-gold.webp`} width={size} height={size} alt="" draggable="false" />;
}

/** Coin counter chip (coin + green plus + amount) - the same on every screen; it opens the coin popup. */
export function CoinChip({ amount, onClick, label, className = '' }) {
  return (
    <button className={'chip coin-chip ' + className} onClick={onClick} aria-label={label}>
      <span className="coin-mark">
        <Coin size={44} />
        <img className="coin-plus" src={`${V5_ART}circle-green.webp`} alt="" draggable="false" />
        <img className="coin-plus cross" src={`${V5_ART}plus-white.webp`} alt="" draggable="false" />
      </span>
      <span className="coin-amount">{amount}</span>
    </button>
  );
}

// `size` is a number of px, or a CSS size string like '60%' (inside the scaled v5 popups)
const dim = (size) => (typeof size === 'string' ? { style: { width: size, height: 'auto' } } : { width: size, height: size });
const fit = (size) => ({ ...dim(size), style: { ...dim(size).style, objectFit: 'contain' } });
export function Bulb({ size = 26 }) {
  return <img src={`${V5_ART}icon-hint.webp`} {...fit(size)} alt="" draggable="false" />;
}

/**
 * Three glossy map-stage stars. `pop` plays the Unity "win popup" star animation (one after the other).
 */
export function Stars({ n, size = 16, className = '', pop = false }) {
  return (
    <span className={'stars ' + className}>
      {[1, 2, 3].map((i) => {
        const on = i <= n;
        return (
          <img
            key={i}
            src={`${ART}map/ui/star-${on ? 'gold' : 'grey'}.webp`}
            width={size}
            height={Math.round(size * 0.95)}
            alt=""
            draggable="false"
            className={pop && on ? ua('win-popup-stars-star-animation') : ''}
            style={pop && on ? uaDelay(0.35 + i * 0.32) : undefined}
          />
        );
      })}
    </span>
  );
}

export const BackIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

/** Round orange "back" button of the v4 UI kit (white curved arrow drawn on top of the glossy bubble). */
export function BackButton({ onClick, label, className = '' }) {
  return (
    <button className={'back-btn ' + className} onClick={onClick} aria-label={label}>
      <img src={`${V5_ART}back-btn.webp`} alt="" draggable="false" />
      <img className="back-arrow" src={`${V5_ART}back-arrow.webp`} alt="" draggable="false" />
    </button>
  );
}

/** Power-up icons: star tile, eraser, eye (peek). */
export function PowerIcon({ id, size = 40 }) {
  const src = id === 'star' ? 'map/ui/star-gold.webp' : `v5/icon-${id}.webp`;
  return <img src={ART + src} {...fit(size)} alt="" draggable="false" />;
}
