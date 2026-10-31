// Loads the top-down art once and prepares derived sprites:
//  - curve: the delivered curve.png does not meet the tile edges exactly, so we bend the (perfectly aligned)
//    straight.png around a quarter circle instead. Same look, guaranteed seams.
//  - train skins: recoloured copies of engine / wagons.
import { recolorToCanvas } from './recolor.js';
import { TRAIN_SKINS, skinById } from '../game/skins.js';

export const ART = `${import.meta.env.BASE_URL}choo-choo-pop-assets/art/`;

export const MAP_ART = ART + 'map/';
// v4 UI kit (art/ui/*.webp, converted from the delivered popup.zip): pill + round buttons, arrows, popup frame, home scene, ...
export const UI_ART = ART + 'ui/';

const FILES = {
  straight: 'track/straight.png',
  // Tunnel gates (v3): green = entry, red = exit. Each image is a capsule lying ACROSS the track; the arrow on it shows
  // the travel direction in the image's own frame (entry: up, exit: down) - BoardCanvas rotates it per board side.
  entry: 'gates/entry.png',
  exit: 'gates/exit.png',
  grassA: 'tiles/grass-a.png',
  grassB: 'tiles/grass-b.png',
  ground: 'tiles/ground-laid.png',
  // glossy map-stage art: given-star tiles and number badges
  starGold: 'map/ui/star-gold.webp',
  starShadow: 'map/ui/star-shadow.webp',
  btnYellow: 'map/ui/btn-yellow.webp',
  btnGreen: 'map/ui/btn-green.webp',
  btnPink: 'map/ui/btn-pink.webp',
  engine: 'train/engine.png',
  wagonBlue: 'train/wagon-blue.png',
  wagonYellow: 'train/wagon-yellow.png',
  wagonGreen: 'train/wagon-green.png',
  smoke: 'train/smoke.png',
  tree: 'deco/tree.png',
  bush: 'deco/bush.png',
  // decorative flowers (soft shadow is baked in)
  flowerPink: 'deco/flower-pink.webp',
  flowerYellow: 'deco/flower-yellow.webp',
};

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('cannot load ' + url));
    im.src = url;
  });
}

/** Tight bounds of the visible pixels. */
function trim(img, threshold = 40) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, w, h).data;
  let x0 = w;
  let y0 = h;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (d[(y * w + x) * 4 + 3] > threshold) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Bend a horizontal straight tile into the quarter turn "left edge -> top edge" (arc centre = top-left corner). */
function warpCurve(straight) {
  const N = 256;
  const src = document.createElement('canvas');
  src.width = src.height = N;
  const sg = src.getContext('2d', { willReadFrequently: true });
  sg.drawImage(straight, 0, 0, N, N);
  const sd = sg.getImageData(0, 0, N, N).data;
  const out = document.createElement('canvas');
  out.width = out.height = N;
  const og = out.getContext('2d');
  const od = og.createImageData(N, N);
  const SS = 2; // supersample for smooth edges
  const sample = (u, v, acc) => {
    if (u < 0 || v < 0 || u >= N - 1 || v >= N - 1) return;
    const x0 = Math.floor(u);
    const y0 = Math.floor(v);
    const fx = u - x0;
    const fy = v - y0;
    for (const [dx, dy, wt] of [
      [0, 0, (1 - fx) * (1 - fy)],
      [1, 0, fx * (1 - fy)],
      [0, 1, (1 - fx) * fy],
      [1, 1, fx * fy],
    ]) {
      const i = ((y0 + dy) * N + x0 + dx) * 4;
      const a = sd[i + 3] / 255;
      acc[0] += sd[i] * a * wt;
      acc[1] += sd[i + 1] * a * wt;
      acc[2] += sd[i + 2] * a * wt;
      acc[3] += a * wt;
    }
  };
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const acc = [0, 0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          const r = Math.hypot(px, py);
          const th = Math.atan2(py, px); // 0 = top edge, pi/2 = left edge
          if (th < 0 || th > Math.PI / 2) continue;
          const u = ((Math.PI / 2 - th) / (Math.PI / 2)) * N;
          sample(u, r, acc);
        }
      }
      const a = acc[3] / (SS * SS);
      const o = (y * N + x) * 4;
      if (a > 0.003) {
        od.data[o] = acc[0] / (SS * SS) / a;
        od.data[o + 1] = acc[1] / (SS * SS) / a;
        od.data[o + 2] = acc[2] / (SS * SS) / a;
        od.data[o + 3] = Math.min(255, a * 255);
      }
    }
  }
  og.putImageData(od, 0, 0);
  return out;
}

/** Left half of the straight tile = a rail that ends in the middle of the cell (the open end of the track). */
function halfStraight(straight) {
  const N = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = N;
  const g = cv.getContext('2d');
  g.drawImage(straight, 0, 0, N, N);
  g.clearRect(N / 2, 0, N / 2, N);
  return cv;
}

let spritesPromise = null;
let sprites = null;
const trainSets = new Map();

export function loadSprites() {
  if (!spritesPromise) {
    spritesPromise = Promise.all(Object.entries(FILES).map(([k, f]) => loadImage(ART + f).then((im) => [k, im]))).then(
      (pairs) => {
        const s = Object.fromEntries(pairs);
        s.curve = warpCurve(s.straight);
        s.half = halfStraight(s.straight);
        s.entryTrim = trim(s.entry, 12);
        s.exitTrim = trim(s.exit, 12);
        s.engineTrim = trim(s.engine);
        s.wagonTrim = trim(s.wagonBlue);
        sprites = s;
        return s;
      },
    );
  }
  return spritesPromise;
}

export const getSprites = () => sprites;

/** { engine, wagons: [blue, yellow, green] } for a train skin (cached). */
export function getTrainSet(skinId) {
  const s = sprites;
  if (!s) return null;
  const skin = skinById(TRAIN_SKINS, skinId);
  if (trainSets.has(skin.id)) return trainSets.get(skin.id);
  const make = (img) => (skin.hue == null ? img : recolorToCanvas(img, skin.hue));
  const set = {
    engine: make(s.engine),
    wagons: [make(s.wagonBlue), make(s.wagonYellow), make(s.wagonGreen)],
  };
  trainSets.set(skin.id, set);
  return set;
}
