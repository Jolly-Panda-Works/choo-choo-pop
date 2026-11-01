// Daily + weekly missions.
// - 8 daily kinds and 8 weekly kinds, each with 3 difficulty tiers (tier = month of play: 1st, 2nd, 3rd month).
// - For the first 3 months (90 days / 13 weeks since the first launch) the schedule is fixed: every day takes 3 kinds
//   in rotation, every week 3 kinds, with the tier of that month - so a player sees 3 months of different missions.
// - After that the missions are picked at random from the same pool (seeded by the date, so they stay the same all day).
// The progress / claim state lives in the save (store.js -> `mis`). Icons: docs/MISSION_ICONS.md.
import { mulberry32 } from './rng.js';
import { POWERUP_STAGE, STAGE_SIZE } from './constants.js';

export const MONTH_DAYS = 30;
export const SCHEDULE_DAYS = 90; // 3 months
export const SCHEDULE_WEEKS = 13;

// id: also the i18n key (m_<id>_t / m_<id>_d) and the icon file (art/missions/<id>.webp)
// ev: the game event that moves it. targets: [month 1, month 2, month 3]. coins: reward per tier.
export const DAILY_KINDS = [
  { id: 'dVisit', ev: 'visit', targets: [1, 1, 1], coins: [10, 15, 20] },
  { id: 'dLevels', ev: 'win', targets: [3, 4, 5], coins: [20, 30, 40] },
  { id: 'dStars', ev: 'stars', targets: [6, 9, 12], coins: [20, 30, 40] },
  { id: 'dPerfect', ev: 'perfect', targets: [1, 2, 3], coins: [25, 35, 45] },
  { id: 'dNoHint', ev: 'nohint', targets: [2, 3, 4], coins: [20, 30, 40] },
  { id: 'dNoMistake', ev: 'nomistake', targets: [1, 2, 3], coins: [25, 35, 45] },
  { id: 'dCoins', ev: 'coins', targets: [30, 50, 80], coins: [15, 25, 35] },
  { id: 'dPower', ev: 'powerup', targets: [1, 2, 3], coins: [25, 35, 45], needsStage: POWERUP_STAGE },
];
export const WEEKLY_KINDS = [
  { id: 'wLevels', ev: 'win', targets: [12, 18, 25], coins: [100, 150, 200], gift: { hints: 2 } },
  { id: 'wStars', ev: 'stars', targets: [24, 36, 48], coins: [100, 150, 200], gift: { hints: 2 } },
  { id: 'wPerfect', ev: 'perfect', targets: [5, 8, 12], coins: [120, 170, 230], gift: { powerup: 'star' } },
  { id: 'wDays', ev: 'visit', targets: [3, 4, 5], coins: [80, 120, 160], gift: { hints: 1 } },
  { id: 'wNoHint', ev: 'nohint', targets: [6, 10, 15], coins: [100, 150, 200], gift: { powerup: 'eraser' } },
  { id: 'wNoMistake', ev: 'nomistake', targets: [4, 7, 10], coins: [110, 160, 220], gift: { powerup: 'peek' } },
  { id: 'wCoins', ev: 'coins', targets: [150, 250, 400], coins: [90, 130, 180], gift: { hints: 2 } },
  { id: 'wPower', ev: 'powerup', targets: [4, 6, 9], coins: [120, 170, 230], gift: { powerup: 'star' }, needsStage: POWERUP_STAGE },
];

const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayNumber = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 864e5);
};
export const daysBetween = (a, b) => dayNumber(b) - dayNumber(a);

const seedOf = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** Pick 3 kinds + a tier for slot index `idx` (0-based day or week number since the first launch). */
function pick(kinds, idx, perDay, schedule, seedStr, unlockedStage) {
  const ok = (k) => !k.needsStage || unlockedStage >= k.needsStage;
  const pool = kinds.filter(ok);
  const out = [];
  if (idx < schedule) {
    const tier = Math.min(2, Math.floor(idx / (schedule / 3)));
    for (let i = 0; i < perDay; i++) {
      // rotate through the FULL list so the plan is always the same; a locked kind is swapped for the next free one
      let k = kinds[(idx * perDay + i) % kinds.length];
      let guard = 0;
      while ((!ok(k) || out.some((o) => o.kind.id === k.id)) && guard++ < kinds.length) k = kinds[(kinds.indexOf(k) + 1) % kinds.length];
      out.push({ kind: k, tier });
    }
  } else {
    const rng = mulberry32(seedOf(seedStr));
    const bag = [...pool];
    for (let i = 0; i < perDay && bag.length; i++) out.push({ kind: bag.splice(Math.floor(rng() * bag.length), 1)[0], tier: Math.floor(rng() * 3) });
  }
  return out.map(({ kind, tier }) => ({
    id: kind.id + tier,
    kind: kind.id,
    ev: kind.ev,
    tier,
    target: kind.targets[tier],
    reward: { coins: kind.coins[tier], ...(kind.gift || {}) },
    p: 0,
    claimed: false,
  }));
}

export const makeDaily = (idx, today, stage) => pick(DAILY_KINDS, idx, 3, SCHEDULE_DAYS, 'd' + today, stage);
export const makeWeekly = (idx, stage) => pick(WEEKLY_KINDS, idx, 3, SCHEDULE_WEEKS, 'w' + idx, stage);

/** Highest stage the player has reached, from the highest unlocked level. */
export const stageReached = (unlocked) => Math.ceil(unlocked / STAGE_SIZE);

/**
 * Bring the mission state up to date for `today` (new day -> new daily list, new week -> new weekly list).
 * Pure: returns a new `mis` object (or the same one when nothing changed).
 */
export function syncMissions(mis, today, unlocked) {
  const stage = stageReached(unlocked);
  let m = mis && mis.start ? mis : { start: today, day: null, daily: [], week: -1, weekly: [], weekDays: [] };
  const idx = Math.max(0, daysBetween(m.start, today));
  const week = Math.floor(idx / 7);
  if (m.day === today && m.week === week) return m;
  m = { ...m };
  if (m.day !== today) {
    m.day = today;
    m.daily = makeDaily(idx, today, stage);
  }
  if (m.week !== week) {
    m.week = week;
    m.weekly = makeWeekly(week, stage);
    m.weekDays = [];
  }
  return m;
}

/** Add progress for a game event to both lists. `visit` also records the day for the "play on N days" weekly. */
export function bumpMissions(mis, ev, amount, today) {
  const step = (list) =>
    list.map((x) => {
      if (x.ev !== ev || x.claimed || x.p >= x.target) return x;
      return { ...x, p: Math.min(x.target, x.p + amount) };
    });
  let weekDays = mis.weekDays;
  let weekly = mis.weekly;
  if (ev === 'visit' && !weekDays.includes(today)) {
    weekDays = [...weekDays, today];
    weekly = mis.weekly.map((x) => (x.ev === 'visit' && !x.claimed ? { ...x, p: Math.min(x.target, weekDays.length) } : x));
    return { ...mis, weekDays, weekly, daily: step(mis.daily) };
  }
  if (ev === 'visit') return { ...mis, daily: step(mis.daily) };
  return { ...mis, daily: step(mis.daily), weekly: step(weekly) };
}

export const missionDone = (x) => x.p >= x.target;
