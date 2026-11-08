// Generous active-play budgets; complexity increases time, never decreases it.
export function timeTargets(level) {
  const rails = level.allSolution?.length || level.lanes.reduce((n,l) => n+l.solution.length,0);
  const trains = level.lanes.length;
  const base = [45, 30, 60, 100, 150][level.difficulty] ?? 30;
  const complexity = 3 * rails + 2 * level.rows * level.cols + 20 * (trains - 1)
    + 8 * (level.walls?.length || 0) + 6 * (level.fixed?.length || 0)
    + 5 * Math.log2(1 + Math.max(0, level.nodes || 0));
  const three = Math.ceil((base + complexity) / 5) * 5;
  return { threeMs: three * 1000, twoMs: three * 2000 };
}
export const timedStars = (elapsedMs, targets) => elapsedMs <= targets.threeMs ? 3 : elapsedMs <= targets.twoMs ? 2 : 1;
export function formatTime(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
}
// Monotonic clock: paused intervals and closed-app time never count.
export function createPlayClock(initialMs = 0, now = () => performance.now()) {
  let total = Number.isFinite(initialMs) && initialMs >= 0 ? initialMs : 0;
  let since = null;
  return {
    read: () => total + (since === null ? 0 : Math.max(0, now() - since)),
    start() { if (since === null) since = now(); },
    stop() { if (since !== null) { total += Math.max(0, now() - since); since = null; } return total; },
    reset() { total = 0; since = null; },
  };
}
