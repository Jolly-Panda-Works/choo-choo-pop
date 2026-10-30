import { getState } from './store.js';

let ctx = null;
function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur = 0.12, type = 'sine', vol = 0.16, delay = 0, slideTo = null) {
  if (!getState().sound) return;
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export function buzz(ms = 12) {
  if (getState().vibrate && navigator.vibrate) navigator.vibrate(ms);
}

export const sfx = {
  lay(n = 0) {
    tone(440 + Math.min(n, 24) * 18, 0.08, 'triangle', 0.14);
    buzz(8);
  },
  undo() {
    tone(300, 0.07, 'triangle', 0.1, 0, 220);
  },
  click() {
    tone(620, 0.06, 'square', 0.06);
    buzz(6);
  },
  hint() {
    tone(660, 0.09, 'sine', 0.14);
    tone(990, 0.12, 'sine', 0.12, 0.08);
  },
  error() {
    tone(200, 0.18, 'sawtooth', 0.08, 0, 140);
    buzz(30);
  },
  whistle() {
    tone(900, 0.22, 'sine', 0.12, 0, 1250);
    tone(1250, 0.3, 'sine', 0.1, 0.2, 1000);
    buzz(40);
  },
  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.13));
    tone(1046.5, 0.5, 'sine', 0.1, 0.55);
  },
};
