// Recolour only the blue/navy parts of a sprite to another hue (gold, white, orange, black stay as they are).
// Used for train skins and panda uniform skins.

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

/** Tints every coloured pixel of a sprite (the wood of a rail) to a hue; grey steel stays grey. */
export function tintToCanvas(img, hue) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const [, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    if (s < 0.14) continue;
    const [r, gg, b] = hslToRgb(hue, Math.min(1, s + 0.15), l);
    d[i] = r;
    d[i + 1] = gg;
    d[i + 2] = b;
  }
  g.putImageData(data, 0, 0);
  return c;
}

function hslToRgb(h, s, l) {
  h /= 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/** Returns a new canvas where every blue-ish pixel got the given hue. */
export function recolorToCanvas(source, targetHue) {
  const w = source.naturalWidth || source.width;
  const h = source.naturalHeight || source.height;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(source, 0, 0);
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const [hh, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    if (hh >= 185 && hh <= 262 && s > 0.18 && l > 0.06 && l < 0.92) {
      const [r, gg, b] = hslToRgb(targetHue, Math.min(1, s * 0.95), l);
      d[i] = r;
      d[i + 1] = gg;
      d[i + 2] = b;
    }
  }
  g.putImageData(img, 0, 0);
  return cv;
}
