import * as THREE from 'three';
import { EDITION } from '../config.js';
import { formatNumber } from '../i18n.js';

const FONT = EDITION === 'fa' ? '"Vazirmatn Variable", system-ui, sans-serif' : '"Trebuchet MS", "Arial Rounded MT Bold", system-ui, sans-serif';

const cache = new Map();

function make(key, size, draw) {
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  draw(cv.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

const STATES = {
  normal: { bg: '#fff3c4', ring: '#f2b632', fg: '#7a4a1d' },
  ok: { bg: '#7ddc8a', ring: '#3fae57', fg: '#ffffff' },
  over: { bg: '#ff8c8c', ring: '#e04b4b', fg: '#ffffff' },
};

export function clueTexture(n, state) {
  const st = STATES[state] || STATES.normal;
  return make(`clue:${n}:${state}`, 128, (g, s) => {
    g.clearRect(0, 0, s, s);
    g.beginPath();
    g.arc(s / 2, s / 2, s * 0.44, 0, Math.PI * 2);
    g.fillStyle = st.bg;
    g.fill();
    g.lineWidth = s * 0.06;
    g.strokeStyle = st.ring;
    g.stroke();
    g.fillStyle = st.fg;
    g.font = `900 ${s * 0.6}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(formatNumber(n), s / 2, s / 2 + s * 0.04);
  });
}

export function starTexture() {
  return make('star', 128, (g, s) => {
    g.clearRect(0, 0, s, s);
    g.translate(s / 2, s / 2 + 4);
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s * 0.42 : s * 0.18;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
    g.fillStyle = '#ffd23f';
    g.fill();
    g.lineWidth = 6;
    g.lineJoin = 'round';
    g.strokeStyle = '#e8a21a';
    g.stroke();
  });
}

/** Cartoon pointing hand; the fingertip sits exactly at the centre of the texture. */
export function fingerTexture() {
  return make('finger', 256, (g, s) => {
    g.clearRect(0, 0, s, s);
    const cx = s / 2;
    const cy = s / 2;
    // touch ripple
    g.beginPath();
    g.arc(cx, cy, s * 0.17, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.fill();
    // hand
    g.lineJoin = 'round';
    g.lineCap = 'round';
    const skin = '#ffd0a6';
    const edge = '#b5683a';
    const draw = (fn) => {
      g.beginPath();
      fn();
      g.fillStyle = skin;
      g.fill();
      g.lineWidth = 7;
      g.strokeStyle = edge;
      g.stroke();
    };
    // palm
    draw(() => g.roundRect(cx - 38, cy + 34, 92, 78, 30));
    // thumb
    draw(() => g.roundRect(cx - 62, cy + 52, 40, 24, 12));
    // finger
    draw(() => g.roundRect(cx - 17, cy - 6, 34, 100, 17));
  });
}

export function ringTexture(color = '#ff9f1a') {
  return make('ring:' + color, 128, (g, s) => {
    g.clearRect(0, 0, s, s);
    g.beginPath();
    g.arc(s / 2, s / 2, s * 0.43, 0, Math.PI * 2);
    g.lineWidth = s * 0.09;
    g.strokeStyle = color;
    g.stroke();
  });
}
