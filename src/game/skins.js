// Cosmetic skins sold in the shop for coins. A skin recolours the navy parts of the art
// (see board/recolor.js), so no extra images are needed. Final hand-drawn skins can replace this later
// (docs/ART_ASSETS_V2.md).
export const TRAIN_SKINS = [
  { id: 'classic', hue: null, price: 0 },
  { id: 'cherry', hue: 352, price: 150 },
  { id: 'violet', hue: 275, price: 150 },
  { id: 'mint', hue: 160, price: 200 },
];
export const PANDA_SKINS = [
  { id: 'classic', hue: null, price: 0 },
  { id: 'crimson', hue: 352, price: 120 },
  { id: 'forest', hue: 140, price: 120 },
  { id: 'royal', hue: 275, price: 150 },
];
export const skinById = (list, id) => list.find((s) => s.id === id) || list[0];
