// Cosmetic looks, bought in Customize with stars earned from stations (`stars` = price). A look recolours the art
// (see board/recolor.js), so no extra images are needed.
export const TRAIN_SKINS = [
  { id: 'classic', hue: null, stars: 0 },
  { id: 'cherry', hue: 352, stars: 15 },
  { id: 'violet', hue: 275, stars: 20 },
  { id: 'mint', hue: 160, stars: 30 },
];
export const RAIL_SKINS = [
  { id: 'classic', hue: null, stars: 0 },
  { id: 'railSky', hue: 205, stars: 10 },
  { id: 'railRose', hue: 340, stars: 15 },
  { id: 'railLime', hue: 110, stars: 20 },
  { id: 'railGrape', hue: 275, stars: 25 },
];
export const PANDA_SKINS = [
  { id: 'classic', hue: null, price: 0 },
  { id: 'crimson', hue: 352, price: 120 },
  { id: 'forest', hue: 140, price: 120 },
  { id: 'royal', hue: 275, price: 150 },
];
export const skinById = (list, id) => list.find((s) => s.id === id) || list[0];
