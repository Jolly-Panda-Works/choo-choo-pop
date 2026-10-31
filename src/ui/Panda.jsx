import { useEffect, useState } from 'react';
import { ART } from '../board/sprites.js';
import { recolorToCanvas } from '../board/recolor.js';
import { PANDA_SKINS, skinById } from '../game/skins.js';

// Panda poses (art/panda/<pose>.webp): wave, lever, whistle, ticket, point, drive, salute, cheer.
// Since v3 these are the finished FULL-BODY stickers from Panda_Train_Conductor_Sticker_Sheet.psd (transparent background):
// they are shown whole - no round crop, no card, no zoom. `size` is the HEIGHT in px; the width follows the pose.
const urls = new Map();
const pending = new Map();

const plainUrl = (pose) => `${ART}panda/${pose}.webp`;

function skinUrl(pose, skinId) {
  const skin = skinById(PANDA_SKINS, skinId);
  const plain = plainUrl(pose);
  if (skin.hue == null) return Promise.resolve(plain);
  const key = pose + ':' + skin.id;
  if (urls.has(key)) return Promise.resolve(urls.get(key));
  if (pending.has(key)) return pending.get(key);
  const p = new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      try {
        // PNG, not JPEG: the sticker has a transparent background
        const url = recolorToCanvas(im, skin.hue).toDataURL('image/png');
        urls.set(key, url);
        resolve(url);
      } catch (e) {
        resolve(plain);
      }
    };
    im.onerror = () => resolve(plain);
    im.src = plain;
  });
  pending.set(key, p);
  return p;
}

export function usePandaSrc(pose, skinId) {
  const [src, setSrc] = useState(plainUrl(pose));
  useEffect(() => {
    let live = true;
    setSrc(plainUrl(pose));
    skinUrl(pose, skinId).then((u) => live && setSrc(u));
    return () => {
      live = false;
    };
  }, [pose, skinId]);
  return src;
}

/**
 * The panda conductor (full body).
 *  variant "avatar": small, next to speech bubbles / on top of popups / on the map
 *  variant "card":   big, story slides
 */
export default function Panda({ pose = 'wave', skin = 'classic', size = 96, variant = 'avatar', className = '' }) {
  const src = usePandaSrc(pose, skin);
  return <img className={`panda panda-${variant} ${className}`} src={src} alt="" draggable="false" style={{ height: size, width: 'auto' }} />;
}
