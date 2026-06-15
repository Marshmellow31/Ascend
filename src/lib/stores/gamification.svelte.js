// gamification.svelte.js — XP, level, achievements, daily ring. Drives celebrations.
import {
  ensureGamification, addXp, updateGamification, unlockAchievements,
} from '../db.js';
import {
  levelProgress, levelTitle, taskXp, focusXp, XP, evaluateAchievements, achievementById,
} from '../logic/gamificationEngine.js';
import { celebrateLevelUp, celebrateAchievement, celebrateRing } from '../utils/feedback.js';
import { ui } from './ui.svelte.js';

class Gamification {
  loaded = $state(false);
  uid = null;
  xp = $state(0);
  level = $state(1);
  achievements = $state({});
  dailyGoalTarget = $state(3);
  lastRingDate = $state(null);

  progress = $derived(levelProgress(this.xp));
  title = $derived(levelTitle(this.level));
  unlockedCount = $derived(Object.keys(this.achievements).length);

  async load(uid) {
    this.uid = uid;
    const rec = await ensureGamification(uid);
    this._apply(rec);
    this.loaded = true;
  }
  _apply(rec) {
    if (!rec) return;
    this.xp = rec.xp || 0;
    this.level = rec.level || 1;
    this.achievements = rec.achievements || {};
    this.dailyGoalTarget = rec.dailyGoalTarget || 3;
    this.lastRingDate = rec.lastRingDate || null;
  }

  async _award(amount) {
    if (!this.uid || !amount) return null;
    const res = await addXp(this.uid, amount);
    if (res) {
      this.xp = res.xp;
      this.level = res.level;
      if (res.leveledUp) this._onLevelUp(res.level);
    }
    return res;
  }
  _onLevelUp(level) {
    celebrateLevelUp();
    ui.celebrate({ kind: 'level', title: `Level ${level}`, subtitle: levelTitle(level), icon: 'sparkles' });
  }

  awardTask(priority) { return this._award(taskXp(priority)); }
  awardFocus(minutes) { return this._award(focusXp(minutes)); }

  async closeDailyRing(todayKey) {
    if (!this.uid || this.lastRingDate === todayKey) return false;
    this.lastRingDate = todayKey;
    await updateGamification(this.uid, { lastRingDate: todayKey });
    await this._award(XP.dailyRing);
    celebrateRing();
    ui.celebrate({ kind: 'ring', title: 'Daily Goal Complete', subtitle: `+${XP.dailyRing} XP`, icon: 'target' });
    return true;
  }

  ringClosedToday(todayKey) { return this.lastRingDate === todayKey; }

  /** Evaluate achievement unlocks against current stats (+ level), celebrate the first. */
  async checkAchievements(stats = {}) {
    if (!this.uid) return;
    const merged = { ...stats, level: this.level, ringClosed: stats.ringClosed ?? false };
    const newly = evaluateAchievements(merged, this.achievements);
    if (!newly.length) return;
    const now = Date.now();
    const next = { ...this.achievements };
    newly.forEach((id) => { next[id] = now; });
    this.achievements = next;
    await unlockAchievements(this.uid, newly);
    const a = achievementById(newly[0]);
    celebrateAchievement();
    ui.celebrate({ kind: 'achievement', title: 'Achievement Unlocked', subtitle: a?.name || '', icon: a?.icon || 'award' });
  }

  async setDailyGoalTarget(n) {
    this.dailyGoalTarget = Math.max(1, Math.min(20, n));
    if (this.uid) await updateGamification(this.uid, { dailyGoalTarget: this.dailyGoalTarget });
  }
}

export const gamification = new Gamification();
