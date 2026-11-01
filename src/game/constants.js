// The game is split into stages (a town/village on the map). Every stage has 20 levels = 20 train stations.
export const STAGE_COUNT = 4;
export const STAGE_SIZE = 20;
// Levels 1..TUTORIAL_LEVELS (stage 1) are the guided 3x3 tutorial.
export const TUTORIAL_LEVELS = 5;
export const START_HINTS = 5;
export const START_COINS = 0;
// Power-ups are unlocked from this stage on.
export const POWERUP_STAGE = 2;
// the level whose start popup teaches a power-up; it stays locked until that lesson was seen
export const POWERUP_TEACH = { star: 21, eraser: 26, peek: 31 };
