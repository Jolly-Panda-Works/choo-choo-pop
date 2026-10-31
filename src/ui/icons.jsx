import { ART } from '../board/sprites.js';

export function Coin({ size = 22 }) {
  return (
    <svg className="coin-ico" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#f5a623" stroke="#b86e00" strokeWidth="2" />
      <circle cx="16" cy="16" r="10" fill="#ffd54a" stroke="#e39a10" strokeWidth="1.6" />
      <path d="M16 8l2.4 5 5.4.6-4 3.7 1.1 5.4-4.9-2.7-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z" fill="#fff3b0" opacity=".95" />
    </svg>
  );
}

export function Heart({ on = true, size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={'heart ' + (on ? 'on' : 'off')}>
      <path d="M12 21s-8-5.2-8-11a4.6 4.6 0 018-3 4.6 4.6 0 018 3c0 5.8-8 11-8 11z" />
    </svg>
  );
}

export function Bulb({ size = 26 }) {
  return <img src={`${ART}ui/bulb.png`} width={size} height={size} alt="" draggable="false" />;
}

/** Three stars (art/ui/star-on|off.png). */
export function Stars({ n, size = 16, className = '' }) {
  return (
    <span className={'stars ' + className}>
      {[1, 2, 3].map((i) => (
        <img key={i} src={`${ART}ui/star-${i <= n ? 'on' : 'off'}.png`} width={size} height={size} alt="" draggable="false" />
      ))}
    </span>
  );
}

export const BackIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
