import { useEffect, useState } from 'react';
import { ART } from '../board/sprites.js';
import { recolorToCanvas } from '../board/recolor.js';
import { PANDA_SKINS, skinById } from '../game/skins.js';

// Panda poses: wave, lever, whistle, ticket, point, drive, salute, cheer  (art/panda/*.webp)
const urls = new Map();
const pending = new Map();

function skinUrl(pose, skinId) {
  const skin = skinById(PANDA_SKINS, skinId);
  const plain = `${ART}panda/${pose}.webp`;
  if (skin.hue == null) return Promise.resolve(plain);
  const key = pose + ':' + skin.id;
  if (urls.has(key)) return Promise.resolve(urls.get(key));
  if (pending.has(key)) return pending.get(key);
  const p = new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      try {
        const url = recolorToCanvas(im, skin.hue).toDataURL('image/jpeg', 0.88);
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
  const [src, setSrc] = useState(`${ART}panda/${pose}.webp`);
  useEffect(() => {
    let live = true;
    skinUrl(pose, skinId).then((u) => live && setSrc(u));
    return () => {
      live = false;
    };
  }, [pose, skinId]);
  return src;
}

/**
 * The panda conductor.
 *  variant "avatar": round head-and-shoulders portrait (speech bubbles, popups)
 *  variant "card":   the full pose on its dark character card (story)
 */
export default function Panda({ pose = 'wave', skin = 'classic', size = 96, variant = 'avatar', className = '' }) {
  const src = usePandaSrc(pose, skin);
  if (variant === 'card') {
    return (
      <div className={'panda-card ' + className} style={{ width: size, height: size * (4 / 3) }}>
        <img src={src} alt="" draggable="false" />
      </div>
    );
  }
  return (
    <div className={'panda-avatar ' + className} style={{ width: size, height: size }}>
      <img src={src} alt="" draggable="false" />
    </div>
  );
}
