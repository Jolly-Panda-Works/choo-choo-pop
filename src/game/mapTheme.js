// Map-stage art (art/map/bg/*.webp, made from "Map Stage/Background/*"): tall island tiles that stack seamlessly
// (all of them start and end in flat sea). Ratio = height / width of each tile.
export const TILE = {
  'green-start': 2163 / 1080, // the start island with the bunny - always the bottom tile
  'green-2': 1710 / 1080,
  'desert-1': 1710 / 1080,
  'desert-2': 1710 / 1080,
  'ice-1': 1710 / 1080,
  'candy-1': 1710 / 1080,
  'candy-2': 1710 / 1080,
  'cloud-1': 1701 / 1080,
  end: 1319 / 1080, // clouds - always the top tile
};

// One island theme per stage (bottom -> top). Stage 1 is the only one built so far, the others are ready for when they are.
// `btn` = colour of the glossy map-stage button used for the stage on the world map.
export const STAGE_THEMES = [
  { id: 'green', btn: 'green', tiles: ['green-start', 'green-2', 'end'] },
  { id: 'desert', btn: 'yellow', tiles: ['desert-1', 'desert-2', 'end'] },
  { id: 'ice', btn: 'blue', tiles: ['ice-1', 'cloud-1', 'end'] },
  { id: 'candy', btn: 'pink', tiles: ['candy-1', 'candy-2', 'end'] },
];

// glossy button colour per station difficulty (see game/levels.js nodeKind)
export const NODE_BTN = { easy: 'green', normal: 'blue', hard: 'orange', super: 'purple' };

export const stackHeight = (tiles) => tiles.reduce((h, n) => h + TILE[n], 0); // in units of the screen width
