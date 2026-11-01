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
  end: 500 / 1080, // clouds - always the top tile; the art is END_OVERLAP taller and fades out over the tile below
};

// One island theme per built stage. All four built stages sit on green islands (see CITIES).
// `btn` = colour of the glossy map-stage button used for the stage on the world map.
export const STAGE_THEMES = [
  { id: 'green', btn: 'green', tiles: ['green-start', 'green-2', 'end'] },
  { id: 'green', btn: 'green', tiles: ['green-start', 'green-2', 'end'] },
  { id: 'green', btn: 'green', tiles: ['green-start', 'green-2', 'end'] },
  { id: 'green', btn: 'green', tiles: ['green-start', 'green-2', 'end'] },
];

// glossy button colour per station difficulty (see game/levels.js nodeKind)
export const NODE_BTN = { easy: 'green', normal: 'blue', hard: 'orange', super: 'purple' };

export const END_OVERLAP = 300 / 1080;
export const stackHeight = (tiles) => tiles.reduce((h, n) => h + TILE[n], 0); // in units of the screen width

// The 18 city spots of the world map, in play order (bottom -> top). Measured on the art: `x` = percent of the map width,
// `f` = position inside its tile (0 = top, 1 = bottom). City i is stage i + 1; spots beyond the built stages stay locked and empty.
// Name every built stage after the climate of its spot (green: spots 1-6, desert: 7-10, ice: 11-15, candy: 16-18).
export const CITIES = [
  { tile: 'green-start', x: 52.9, f: 0.820 },
  { tile: 'green-start', x: 71.7, f: 0.714 },
  { tile: 'green-start', x: 55.7, f: 0.447 },
  { tile: 'green-start', x: 52.8, f: 0.326 },
  { tile: 'green-start', x: 51.2, f: 0.151 },
  { tile: 'green-start', x: 44.4, f: 0.052 },
  { tile: 'desert-1', x: 50.8, f: 0.898 },
  { tile: 'desert-1', x: 51.6, f: 0.715 },
  { tile: 'desert-1', x: 57.8, f: 0.392 },
  { tile: 'desert-1', x: 62.5, f: 0.223 },
  { tile: 'ice-1', x: 53.5, f: 0.891 },
  { tile: 'ice-1', x: 52.3, f: 0.678 },
  { tile: 'ice-1', x: 51.7, f: 0.524 },
  { tile: 'ice-1', x: 43.1, f: 0.265 },
  { tile: 'ice-1', x: 45.2, f: 0.100 },
  { tile: 'candy-1', x: 52.4, f: 0.787 },
  { tile: 'candy-1', x: 44.8, f: 0.605 },
  { tile: 'candy-1', x: 51.9, f: 0.177 },
];

// glossy button colour + number outline colour per island theme (by the tile a city sits on)
export const TILE_BTN = {
  'green-start': { btn: 'green', ink: '#3b9f1c' },
  'desert-1': { btn: 'yellow', ink: '#c2740a' },
  'ice-1': { btn: 'blue', ink: '#1d93a8' },
  'candy-1': { btn: 'pink', ink: '#c93a7a' },
};
