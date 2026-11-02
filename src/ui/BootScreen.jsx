import { useEffect, useState } from 'react';
import Logotype from './Logotype.jsx';
import { UI_ART, V5_ART } from '../board/sprites.js';

const BASE = import.meta.env.BASE_URL;
// what Home needs, so it is complete when the screen lifts
const ART = [
  ...['home-bg', 'home-floor', 'h-play', 'h-spin', 'h-map', 'h-missions', 'h-shop', 'h-settings', 'h-custom', 'icon-free-coins', 'coin-gold'].map((n) => `${V5_ART}${n}.webp`),
  ...['tree-rose', 'tree-yellow'].map((n) => `${UI_ART}${n}.webp`),
];
const MIN_SHOWN_MS = 1800; // the studio card covers the start of it
const STUDIO_MS = 2400;

const loadImage = (src) =>
  new Promise((resolve) => {
    const im = new Image();
    im.onload = im.onerror = resolve;
    im.src = src;
  });

/** First loading screen: the game's name, and a train that pulls the bar as Home's pictures arrive. */
export default function BootScreen({ onDone }) {
  const [p, setP] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let live = true;
    const timers = [];
    let loaded = 0;
    const started = performance.now();
    const shownFrom = Math.max(started, STUDIO_MS);
    ART.forEach((src) =>
      loadImage(src).then(() => {
        loaded += 1;
        if (!live) return;
        // the bar keeps to the slower of the art and the minimum time on screen
        const tick = () => {
          const time = Math.min(1, (performance.now() - shownFrom) / MIN_SHOWN_MS);
          const next = Math.max(0, Math.min(loaded / ART.length, time));
          setP(next);
          if (next >= 1) {
            setDone(true);
            timers.push(setTimeout(onDone, 380));
          } else if (loaded === ART.length) timers.push(setTimeout(tick, 120));
        };
        tick();
      }),
    );
    return () => {
      live = false;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className={'boot' + (done ? ' done' : '')} style={{ '--p': p }}>
      <div className="boot-logo">
        <Logotype />
      </div>
      <div className="boot-track">
        <img src={`${BASE}boot/load-empty.webp`} alt="" draggable="false" />
        <div className="boot-bar">
          <img src={`${BASE}boot/load-bar.webp`} alt="" draggable="false" />
        </div>
        <img src={`${BASE}boot/load-frame.webp`} alt="" draggable="false" />
        <img className="boot-train" src={`${BASE}boot/load-train.webp`} alt="" draggable="false" />
      </div>
    </div>
  );
}
