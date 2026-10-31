// The game is split into stages (a town/village on the map). Every stage has 20 levels = 20 train stations.
export const STAGE_COUNT = 4;
export const STAGE_SIZE = 20;
// Levels 1..TUTORIAL_LEVELS (stage 1) are the guided 3x3 tutorial.
export const TUTORIAL_LEVELS = 5;
export const START_HINTS = 5;
export const START_COINS = 0;
// Wrong "station checks" (reaching the exit with wrong numbers) allowed before the run fails. Not in the tutorial.
export const MAX_MISTAKES = 3;
