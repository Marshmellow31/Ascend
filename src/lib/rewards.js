// rewards.js — central reward flow so Dashboard, Tasks, Growth, Focus all behave
// identically: XP + celebration on task complete, daily-ring close, achievement checks.

import { completeTask } from './db.js';
import { gamification } from './stores/gamification.svelte.js';
import { celebrateTask } from './utils/feedback.js';
import { effectiveTodayStr } from './utils/dates.js';

/** Complete a task and grant its XP + a small celebration. */
export async function completeTaskWithRewards(task) {
  await completeTask(task.id);
  celebrateTask();
  return gamification.awardTask(task.priority);
}

/**
 * After any productivity event, reconcile the daily ring + achievements.
 * @param analytics result of computeAnalytics(From)
 * @param focusStats { focusSessions, focusMinutes }
 */
export async function syncProgress(analytics, focusStats = {}) {
  const todayKey = effectiveTodayStr();
  let ringClosed = gamification.ringClosedToday(todayKey);

  if (!ringClosed && (analytics?.todayCompleted || 0) >= gamification.dailyGoalTarget) {
    await gamification.closeDailyRing(todayKey);
    ringClosed = true;
  }

  await gamification.checkAchievements({
    totalCompleted: analytics?.totalCompleted || 0,
    streak: analytics?.streak || 0,
    perfectWeek: analytics?.perfectWeek || false,
    earlyBird: analytics?.earlyBird || false,
    nightOwl: analytics?.nightOwl || false,
    focusSessions: focusStats.focusSessions || 0,
    focusMinutes: focusStats.focusMinutes || 0,
    ringClosed,
  });
}
