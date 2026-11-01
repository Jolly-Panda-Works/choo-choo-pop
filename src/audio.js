import { getState, subscribe } from './store.js';

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

// Sound effects of the game (public/choo-choo-pop-assets/sfx, from the GUI pack). Loaded once at start.
const SOUNDS = ['click', 'lay', 'undo', 'error', 'open', 'close', 'coins', 'hint', 'win', 'levelup', 'wheel-open', 'wheel-spin'];
const buffers = {};
export async function loadSounds() {
  const c = ac();
  if (!c) return;
  await Promise.all(
    SOUNDS.map(async (name) => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}choo-choo-pop-assets/sfx/${name}.mp3`);
        buffers[name] = await c.decodeAudioData(await res.arrayBuffer());
      } catch (e) {
        /* that one sound stays silent */
      }
    }),
  );
}

function play(name, { vol = 0.7, rate = 1 } = {}) {
  if (!getState().sound || !buffers[name]) return;
  const c = ac();
  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = buffers[name];
  src.playbackRate.value = rate;
  g.gain.value = vol;
  src.connect(g).connect(c.destination);
  src.start();
}

// Background music: one bright loop, streamed from the file (decoding 74 s of it would hold 26 MB in memory).
// Off in Settings and while the app is in the background.
const MUSIC_VOL = 0.22;
let music = null;
function syncMusic() {
  if (!music) return;
  if (getState().music && !document.hidden) music.play().catch(() => {});
  else music.pause();
}
function startMusic() {
  if (music) return;
  music = new Audio(`${import.meta.env.BASE_URL}choo-choo-pop-assets/music/loop.mp3`);
  music.loop = true;
  music.volume = MUSIC_VOL;
  syncMusic();
}
/** Browsers only allow sound after a tap, so the music starts on the first one. */
export function setupMusic() {
  subscribe(syncMusic);
  window.addEventListener('pointerdown', startMusic);
  document.addEventListener('visibilitychange', () => {
    syncMusic();
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else ctx.resume();
  });
}

export function buzz(ms = 12) {
  if (getState().vibrate && navigator.vibrate) navigator.vibrate(ms);
}

export const sfx = {
  lay(n = 0) {
    play('lay', { rate: 0.9 + Math.min(n, 24) * 0.03 }); // climbs as the rail gets longer
    buzz(8);
  },
  undo() {
    play('undo');
  },
  click() {
    play('click');
    buzz(6);
  },
  open() {
    play('open');
  },
  close() {
    play('close');
  },
  coins() {
    play('coins');
  },
  hint() {
    play('hint', { vol: 0.5 });
  },
  error() {
    play('error');
    buzz(30);
  },
  whistle() {
    tone(900, 0.22, 'sine', 0.12, 0, 1250);
    tone(1250, 0.3, 'sine', 0.1, 0.2, 1000);
    buzz(40);
  },
  win() {
    play('win');
  },
  levelUp() {
    play('levelup');
  },
  wheelOpen() {
    play('wheel-open');
  },
  wheelSpin() {
    play('wheel-spin', { rate: 1.15 }); // the wheel turns for 4.3 s
  },
};
