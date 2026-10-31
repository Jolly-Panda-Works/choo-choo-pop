// Helpers for the converted Unity UI animations (unity-anims.css / unity-anims.json, made by scripts/convert-unity-anims.py).
//
//   <div className={ua('buttons-bubbles-enter1')} />          one-shot / looping clip on mount (id = folder-clip, kebab-case)
//   <div className={ua('idle-press-bubble-button-idle')} />   looping clips (the converter marks them infinite)
//   <div style={uaDelay(0.3)} className={ua('win-popup-stars-star-animation')} />
//   playUA(el, 'buttons-bubbles-pressed')                      restart a clip on an element (e.g. on tap)
//
// Child curves of a clip ("path" in Unity) apply to descendants marked  data-ua="<path>"  (only 1 clip uses this).
// Canvas units of Unity position curves are scaled with the CSS variable --ua-u (default .36px, see unity-anims.css).
import './unity-anims.css';

export const ua = (id, extra = '') => `ua ua-${id}${extra ? ' ' + extra : ''}`;
export const uaDelay = (seconds) => ({ animationDelay: `${seconds}s` });

export function playUA(el, id, onEnd) {
  if (!el) return;
  for (const c of [...el.classList]) if (c.startsWith('ua-')) el.classList.remove(c);
  void el.offsetWidth; // restart
  el.classList.add('ua', 'ua-' + id);
  if (onEnd) el.addEventListener('animationend', onEnd, { once: true });
}
