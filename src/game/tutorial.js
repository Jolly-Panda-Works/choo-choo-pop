// Guidance for the five tutorial levels (3x3 boards). The coach never blocks the player:
// it shows a short text, an animated finger and (sometimes) glowing numbers / star.
import { TUTORIAL_LEVELS } from './constants.js';

export const isTutorial = (level) => level.id <= TUTORIAL_LEVELS;

// text keys live in i18n.js
//  ghost   : 'route' = finger slides the whole way (only while nothing is laid yet)
//            'next'  = after `idleMs` without a move the finger shows the next tile
//  clues   : pulse a ring around the row / column numbers
//  star    : pulse a ring around the gold star tile
const CONFIG = {
  1: { start: 'tut1', ghost: 'route', idleMs: 800 },
  2: { start: 'tut2', ghost: 'next', idleMs: 2500 },
  3: { start: 'tut3', mid: 'tut3b', ghost: 'next', idleMs: 6000, clues: true },
  4: { start: 'tut4', good: 'tut4b', ghost: 'next', idleMs: 6000, clues: true },
  5: { start: 'tut5', ghost: 'next', idleMs: 8000, star: true },
};

export const tutorialIdleMs = (level) => CONFIG[level.id]?.idleMs ?? 0;

/** How much of the player's path matches the answer, and how many rails are off-track. */
export function analyzePath(level, path) {
  const sol = level.solution;
  let good = 0;
  while (good < path.length && good < sol.length && path[good] === sol[good]) good++;
  return { good, wrong: path.length - good };
}

/**
 * What the coach shows right now.
 * @returns {null | { text: string, ghost: null | { kind: 'route'|'next'|'back', cells: number[] }, clues: boolean, star: boolean }}
 */
export function coachFor(level, path, idle) {
  const cfg = CONFIG[level.id];
  if (!cfg) return null;
  const { good, wrong } = analyzePath(level, path);
  const sol = level.solution;
  const started = path.length > 1 && wrong === 0;

  // a rail is in the wrong place -> teach "slide back to erase"
  if (wrong > 0) {
    const text = level.preset && path.length === level.preset.length ? cfg.start : 'tutWrong';
    return { text, ghost: { kind: 'back', cells: path.slice(good - 1).reverse() }, clues: !!cfg.clues, star: !!cfg.star };
  }

  let text = cfg.start;
  if (started) text = cfg.mid || (level.preset && cfg.good) || cfg.start;
  if (level.preset && !started && cfg.good) text = cfg.good;

  let ghost = null;
  if (cfg.ghost === 'route' && !started && idle) ghost = { kind: 'route', cells: sol };
  else if (idle && good < sol.length) ghost = { kind: 'next', cells: [path[path.length - 1], sol[good]] };

  return { text, ghost, clues: !!cfg.clues, star: !!cfg.star };
}

/**
 * Idle hint of a normal station: the finger drags from the last rail toward the exit, along the row or column
 * with the longer way to go. It points the way only, it does not give the answer away.
 * @returns {null | { ghost: { kind: 'next', cells: number[] } }}
 */
export function idleCoach(level, paths) {
  const { rows, cols } = level;
  const taken = new Set([...paths.flat(), ...level.blocks]);
  const open = (r, c) => r >= 0 && c >= 0 && r < rows && c < cols && !taken.has(r * cols + c);
  const lanes = paths
    .map((p, li) => ({ p, exit: level.lanes[li].exit }))
    .filter(({ p, exit }) => p[p.length - 1] !== exit.r * cols + exit.c)
    .sort((a, b) => b.p.length - a.p.length);
  for (const { p, exit } of lanes) {
    const last = p[p.length - 1];
    const r = Math.floor(last / cols);
    const c = last % cols;
    const dr = exit.r - r;
    const dc = exit.c - c;
    const steps = [[0, Math.sign(dc)], [Math.sign(dr), 0]].filter(([a, b]) => a || b);
    if (Math.abs(dr) > Math.abs(dc)) steps.reverse();
    for (const [a, b] of steps) {
      const cells = [last];
      for (let n = 1; n <= 2 && open(r + a * n, c + b * n); n++) cells.push((r + a * n) * cols + c + b * n);
      if (cells.length > 1) return { ghost: { kind: 'next', cells } };
    }
  }
  return null;
}
