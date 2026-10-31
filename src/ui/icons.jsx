import { ART, UI_ART } from '../board/sprites.js';
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
        <radialGradient id="g-heart" cx="35%" cy="28%" r="85%">
          <stop offset="0" stopColor="#ff9aa8" />
          <stop offset="0.5" stopColor="#ff4d6a" />
          <stop offset="1" stopColor="#d92a4b" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function Coin({ size = 22 }) {
  return (
    <svg className="coin-ico" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <circle cx="16" cy="17" r="14" fill="#c97d08" opacity=".55" />
      <circle cx="16" cy="15.5" r="14" fill="url(#g-coin)" stroke="#fff" strokeWidth="2" />
      <circle cx="16" cy="15.5" r="9.4" fill="none" stroke="#e09a0c" strokeWidth="1.6" />
      <path d="M16 9.4l2.1 4.3 4.7.6-3.4 3.2.9 4.7-4.3-2.3-4.3 2.3.9-4.7-3.4-3.2 4.7-.6z" fill="#fff9d0" />
      <path d="M8 9.5a9.6 9.6 0 016-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".85" />
    </svg>
  );
}

export function Heart({ on = true, size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={'heart ' + (on ? 'on' : 'off')}>
      <path d="M12 21s-8-5.2-8-11a4.6 4.6 0 018-3 4.6 4.6 0 018 3c0 5.8-8 11-8 11z" />
      {on && <path className="heart-shine" d="M6.6 9.2a3 3 0 012.2-2.4" />}
    </svg>
  );
}

export function Bulb({ size = 26 }) {
  return <img src={`${ART}ui/bulb.png`} width={size} height={size} alt="" draggable="false" />;
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
