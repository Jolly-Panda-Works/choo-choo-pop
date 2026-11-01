import { useEffect, useLayoutEffect, useState } from 'react';
import { MAP_ART } from '../board/sprites.js';
import { TILE } from '../game/mapTheme.js';
import { ua, uaDelay } from '../anim/ua.js';

/** Width (px) of an element, kept up to date. */
export function useWidth(ref) {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const set = () => setW(el.clientWidth);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/**
 * Drag-to-scroll for a scroller (mouse / pen; touch keeps its native scrolling). The scrollbar is hidden in CSS.
 * Same behaviour as the stage map: grab cursor, inertia after a flick, and the click that ends a drag is swallowed.
 * `onGrab` is called when the user takes hold of the scroller (so a running camera animation can stop).
 */
export function useDragScroll(ref, dep, onGrab) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let id = null, startY = 0, startTop = 0, lastY = 0, lastT = 0, v = 0, moved = false, raf = 0, swallow = false;
    const glide = () => {
      el.scrollTop += v * 16;
      v *= 0.94;
      if (Math.abs(v) > 0.02) raf = requestAnimationFrame(glide);
    };
    const down = (e) => {
      onGrab?.();
      if (e.pointerType === 'touch' || e.button !== 0) return;
      cancelAnimationFrame(raf);
      id = e.pointerId;
      startY = lastY = e.clientY;
      startTop = el.scrollTop;
      lastT = performance.now();
      v = 0;
      moved = false;
    };
    const move = (e) => {
      if (e.pointerId !== id) return;
      const dy = e.clientY - startY;
      if (!moved && Math.abs(dy) > 6) {
        moved = true;
        el.setPointerCapture(id);
        el.classList.add('dragging');
      }
      if (!moved) return;
      el.scrollTop = startTop - dy;
      const now = performance.now();
      v = 0.6 * ((lastY - e.clientY) / Math.max(1, now - lastT)) + 0.4 * v;
      lastY = e.clientY;
      lastT = now;
    };
    const up = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      el.classList.remove('dragging');
      if (moved) {
        swallow = true;
        setTimeout(() => (swallow = false), 0);
        if (performance.now() - lastT < 80) raf = requestAnimationFrame(glide);
      }
    };
    const click = (e) => {
      if (swallow) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    const grab = () => onGrab?.();
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', click, true);
    el.addEventListener('wheel', grab, { passive: true });
    el.addEventListener('touchstart', grab, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('click', click, true);
      el.removeEventListener('wheel', grab);
      el.removeEventListener('touchstart', grab);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);
}

/** Two cloud banks that cover the top and the bottom of a scroll area, so content fades softly into the sky. */
export function CloudEdges() {
  const style = { backgroundImage: `url(${MAP_ART}ui/clouds-band.webp)` };
  return (
    <>
      <div className="cloud-edge top" style={style} aria-hidden="true" />
      <div className="cloud-edge bottom" style={style} aria-hidden="true" />
    </>
  );
}

/** Smooth (Catmull-Rom) path through points [[x,y],...] */
export function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** The island tiles of a theme, stacked (tiles are listed bottom -> top). */
export function TileStack({ tiles }) {
  return (
    <div className="tile-stack" aria-hidden="true">
      {[...tiles].reverse().map((n, i) => (
        <img key={n + i} src={`${MAP_ART}bg/${n}.webp`} alt="" draggable="false" style={{ aspectRatio: `1080 / ${Math.round(TILE[n] * 1080)}` }} />
      ))}
    </div>
  );
}

// soft drifting clouds + glittering water on the sides of the map (Unity clips: level-scene-portrait-clouds / water-shine)
const CLOUDS = [
  { img: 'cloud-1', left: -14, k: 0.5, clip: 'level-scene-portrait-clouds-cloud-i1dle', at: 0.12 },
  { img: 'cloud-2', left: 74, k: 0.42, clip: 'level-scene-portrait-clouds-cloud2-idle', at: 0.3 },
  { img: 'cloud-1', left: 78, k: 0.46, clip: 'level-scene-portrait-clouds-cloud2-idle', at: 0.52 },
  { img: 'cloud-2', left: -12, k: 0.4, clip: 'level-scene-portrait-clouds-cloud-i1dle', at: 0.7 },
  { img: 'cloud-1', left: 72, k: 0.48, clip: 'level-scene-portrait-clouds-cloud-i1dle', at: 0.88 },
];
const SHINES = [
  [4, 0.08], [92, 0.17], [6, 0.26], [90, 0.41], [3, 0.58], [93, 0.64], [7, 0.8], [91, 0.93],
];

export function SeaDecor() {
  return (
    <div className="sea-decor" aria-hidden="true">
      {SHINES.map(([x, y], i) => (
        <img
          key={'s' + i}
          className={'water-shine ' + ua('level-scene-portrait-water-shine-water-shine-idle')}
          style={{ left: x + '%', top: y * 100 + '%', ...uaDelay(i * 0.23) }}
          src={`${MAP_ART}ui/water-shine.webp`}
          alt=""
          draggable="false"
        />
      ))}
      {CLOUDS.map((c, i) => (
        <img
          key={'c' + i}
          className={'sea-cloud ' + ua(c.clip)}
          style={{ left: c.left + '%', top: c.at * 100 + '%', width: c.k * 100 + '%', opacity: 0.92 }}
          src={`${MAP_ART}ui/${c.img}.webp`}
          alt=""
          draggable="false"
        />
      ))}
    </div>
  );
}

export const Crown = () => (
  <svg className="crown" viewBox="0 0 32 22" width="30" height="21" aria-hidden="true">
    <path d="M3 19 L1 5 L10 11 L16 2 L22 11 L31 5 L29 19 Z" fill="#ffd43b" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M4 17 L3 8 L10 13 L16 5 L22 13 L29 8 L28 17 Z" fill="#ffc21a" />
    <circle cx="16" cy="12" r="2.2" fill="#e64980" />
  </svg>
);

export { useEffect };
