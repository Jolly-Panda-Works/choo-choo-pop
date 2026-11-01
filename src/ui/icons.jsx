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

export function Coin({ size = 22 }) {
  return <img className="coin-ico" src={`${V5_ART}coin-gold.webp`} width={size} height={size} alt="" draggable="false" />;
}

// `size` is a number of px, or a CSS size string like '60%' (inside the scaled v5 popups)
const dim = (size) => (typeof size === 'string' ? { style: { width: size, height: 'auto' } } : { width: size, height: size });
export function Bulb({ size = 26 }) {
  return <img src={`${ART}ui/bulb.png`} {...dim(size)} alt="" draggable="false" />;
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
      <img src={`${UI_ART}round-orange.webp`} alt="" draggable="false" />
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M12.5 8.5L6 15l6.5 6.5" />
        <path d="M6.5 15H19a6.2 6.2 0 010 12.4h-4" />
      </svg>
    </button>
  );
}

/** Power-up icons: star tile, eraser, eye (peek). */
export function PowerIcon({ id, size = 40 }) {
  if (id === 'star') return <img src={`${ART}map/ui/star-gold.webp`} {...dim(size)} alt="" draggable="false" />;
  if (id === 'eraser')
    return (
      <svg viewBox="0 0 40 40" {...dim(size)} aria-hidden="true">
        <rect x="5" y="15" width="30" height="16" rx="5" transform="rotate(-25 20 23)" fill="#ff8fa8" stroke="#fff" strokeWidth="2.5" />
        <rect x="5" y="15" width="13" height="16" rx="5" transform="rotate(-25 20 23)" fill="#fff" opacity=".85" />
        <path d="M8 35h24" stroke="#c93a5e" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 40 40" {...dim(size)} aria-hidden="true">
      <path d="M3 20C9 9 31 9 37 20 31 31 9 31 3 20z" fill="#fff" stroke="#1f9bb0" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="7.5" fill="#3fd6e0" stroke="#1f9bb0" strokeWidth="2" />
      <circle cx="20" cy="20" r="3.2" fill="#134a55" />
      <circle cx="22.5" cy="17.5" r="1.6" fill="#fff" />
    </svg>
  );
}
