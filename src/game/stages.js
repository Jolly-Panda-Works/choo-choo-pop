import { STAGE_COUNT, STAGE_SIZE } from './constants.js';
import { levelCount } from './levels.js';

// Six playable lands with twenty puzzles each.
// Position of the stage on the map (percent of the map width / height) lives in screens/StageMap.jsx.
export const STAGES = Array.from({ length: STAGE_COUNT }, (_, i) => ({
  id: i + 1,
  first: i * STAGE_SIZE + 1,
  last: (i + 1) * STAGE_SIZE,
  // text keys: stage1Name ... (i18n.js)
  nameKey: 'stage' + (i + 1) + 'Name',
  // Level numbers (inside the stage, 1..20) that are "super hard". Stage 1 only has the very last one.
  superHard: [],
}));

export const stageOfLevel = (n) => Math.min(STAGE_COUNT, Math.ceil(n / STAGE_SIZE));
export const indexInStage = (n) => ((n - 1) % STAGE_SIZE) + 1;
/** Is this stage playable (all its levels are built)? */
export const stageBuilt = (stageId) => levelCount >= STAGES[stageId - 1].last;
export const stageLevels = (stageId) => Array.from({ length: STAGE_SIZE }, (_, i) => STAGES[stageId - 1].first + i);
