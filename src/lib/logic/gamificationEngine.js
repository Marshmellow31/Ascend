// gamificationEngine.js — pure XP/level/achievement logic (no DOM, no Firestore).

// ── Level curve ──────────────────────────────────────────────────────────────
// Cumulative XP required to *reach* a given level.
export function xpToReach(level) {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.5));
}

export function levelFromXp(xp) {
  let lvl = 1;
  while (xpToReach(lvl + 1) <= xp) lvl++;
  return lvl;
}

/** { level, into, span, pct, next, xp } for rendering the XP bar. */
export function levelProgress(xp = 0) {
  const level = levelFromXp(xp);
  const cur = xpToReach(level);
  const next = xpToReach(level + 1);
  const into = xp - cur;
  const span = next - cur;
  return { level, into, span, next, xp, pct: span > 0 ? Math.min(100, Math.round((into / span) * 100)) : 100 };
}

export function levelTitle(level) {
  const titles = [
    [1, 'Novice'], [3, 'Apprentice'], [5, 'Rising Star'], [8, 'Achiever'],
    [12, 'Strategist'], [16, 'Master'], [20, 'Ascendant'], [30, 'Legend'],
  ];
  let title = 'Novice';
  for (const [lv, name] of titles) if (level >= lv) title = name;
  return title;
}

// ── XP rules ─────────────────────────────────────────────────────────────────
export const XP = {
  taskBase: 10,
  priorityBonus: { high: 8, medium: 4, low: 2 },
  goalTask: 12,
  focusPerMin: 1,
  focusSessionBonus: 15,
  dailyRing: 30,
  streakMilestone: 25,
};

export function taskXp(priority = 'medium') {
  return XP.taskBase + (XP.priorityBonus[String(priority).toLowerCase()] ?? XP.priorityBonus.medium);
}
export function focusXp(durationMin) {
  return XP.focusSessionBonus + Math.min(90, Math.round(durationMin || 0)) * XP.focusPerMin;
}

// ── Achievements ─────────────────────────────────────────────────────────────
// `icon` values map to entries in src/lib/icons.js.
export const ACHIEVEMENTS = [
  { id: 'first_task',  name: 'First Step',     desc: 'Complete your first task',   icon: 'check',     test: (s) => s.totalCompleted >= 1 },
  { id: 'tasks_10',    name: 'Getting Going',  desc: 'Complete 10 tasks',          icon: 'check-check', test: (s) => s.totalCompleted >= 10 },
  { id: 'tasks_50',    name: 'Task Machine',   desc: 'Complete 50 tasks',          icon: 'zap',       test: (s) => s.totalCompleted >= 50 },
  { id: 'tasks_100',   name: 'Centurion',      desc: 'Complete 100 tasks',         icon: 'trophy',    test: (s) => s.totalCompleted >= 100 },
  { id: 'streak_3',    name: 'Warming Up',     desc: 'Reach a 3-day streak',       icon: 'flame',     test: (s) => s.streak >= 3 },
  { id: 'streak_7',    name: 'On Fire',        desc: 'Reach a 7-day streak',       icon: 'flame',     test: (s) => s.streak >= 7 },
  { id: 'streak_30',   name: 'Unstoppable',    desc: 'Reach a 30-day streak',      icon: 'flame',     test: (s) => s.streak >= 30 },
  { id: 'first_focus', name: 'In the Zone',    desc: 'Finish a focus session',     icon: 'timer',     test: (s) => s.focusSessions >= 1 },
  { id: 'focus_10h',   name: 'Deep Diver',     desc: 'Log 10 hours of focus',      icon: 'waves',     test: (s) => s.focusMinutes >= 600 },
  { id: 'level_5',     name: 'Rising Star',    desc: 'Reach level 5',              icon: 'star',      test: (s) => s.level >= 5 },
  { id: 'level_10',    name: 'Ascendant',      desc: 'Reach level 10',             icon: 'sparkles',  test: (s) => s.level >= 10 },
  { id: 'night_owl',   name: 'Night Owl',      desc: 'Finish a task after midnight', icon: 'moon',    test: (s) => s.nightOwl },
  { id: 'early_bird',  name: 'Early Bird',     desc: 'Finish a task before 7 AM',  icon: 'sunrise',   test: (s) => s.earlyBird },
  { id: 'perfect_week', name: 'Perfect Week',  desc: '100% completion in a week',  icon: 'award',     test: (s) => s.perfectWeek },
  { id: 'ring_master', name: 'Ring Master',    desc: 'Close your daily ring',      icon: 'target',    test: (s) => s.ringClosed },
];

/** Return ids of achievements newly satisfied by `stats` but not yet `unlocked`. */
export function evaluateAchievements(stats = {}, unlocked = {}) {
  return ACHIEVEMENTS
    .filter((a) => !unlocked[a.id])
    .filter((a) => { try { return a.test(stats); } catch { return false; } })
    .map((a) => a.id);
}

export function achievementById(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) || null;
}
