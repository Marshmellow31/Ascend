// analytics.js — weekly progress, streak, heatmap, insights (pure compute).
import { getTasks } from '../db.js';

export function getWeekBounds(weekStartDay = 'monday') {
  const now = new Date();
  const day = now.getDay();
  const startOffset = weekStartDay === 'sunday' ? 0 : 1;
  const daysFromStart = (day - startOffset + 7) % 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysFromStart);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

function asDate(ts) {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}

export function computeStreak(dateSet) {
  if (dateSet.size === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (dateSet.has(key)) { streak++; cursor.setDate(cursor.getDate() - 1); }
    else if (i === 0) { cursor.setDate(cursor.getDate() - 1); } // today not done yet → keep yesterday's streak alive
    else break;
  }
  return streak;
}

export async function computeAnalytics(uid, weekStartDay = 'monday', topics = []) {
  const allTasks = await getTasks(uid);
  return computeAnalyticsFrom(allTasks, weekStartDay, topics);
}

/** Pure: compute analytics from an already-fetched task array. */
export function computeAnalyticsFrom(allTasks, weekStartDay = 'monday', topics = []) {
  const now = new Date();
  const { weekStart, weekEnd } = getWeekBounds(weekStartDay);
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const todayFull = new Date(now); todayFull.setHours(23, 59, 59, 999);
  const startHeatmap = new Date(todayFull); startHeatmap.setDate(todayFull.getDate() - 167); startHeatmap.setHours(0, 0, 0, 0);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (weekStartDay === 'sunday') days.unshift(days.pop());
  const dailyCompleted = new Array(7).fill(0);
  const dailyTotal = new Array(7).fill(0);

  const weekTasks = [];
  const weekCompleted = [];
  const overdue = [];
  const todayTasks = [];
  let todayCompleted = 0;
  const taskCountsByDate = {};
  const allDayTotals = new Array(7).fill(0);
  let totalHistoricCompleted = 0;
  let earlyBird = false;
  let nightOwl = false;
  const streakDatesSet = new Set();
  const topicCounters = {};
  topics.forEach((t) => { topicCounters[t.id] = { total: 0, completed: 0 }; });

  for (const t of allTasks) {
    const dueDate = asDate(t.dueDate);
    const completedAt = (t.isCompleted && t.completedAt) ? asDate(t.completedAt) : null;
    const inWeekDue = dueDate && dueDate >= weekStart && dueDate <= weekEnd;
    const inWeekCompleted = completedAt && completedAt >= weekStart && completedAt <= weekEnd;

    if (inWeekDue || inWeekCompleted) {
      weekTasks.push(t);
      if (inWeekCompleted) weekCompleted.push(t);
      const dayRef = dueDate || completedAt;
      if (dayRef) {
        const dayIndex = Math.floor((dayRef - weekStart) / 86400000);
        if (dayIndex >= 0 && dayIndex < 7) { dailyTotal[dayIndex]++; if (inWeekCompleted) dailyCompleted[dayIndex]++; }
      }
      if (t.subjectId && topicCounters[t.subjectId]) {
        topicCounters[t.subjectId].total++;
        if (inWeekCompleted) topicCounters[t.subjectId].completed++;
      }
    }
    if (!t.isCompleted && dueDate && dueDate < now) overdue.push(t);
    if (!t.isCompleted && dueDate && dueDate >= today && dueDate < tomorrow) todayTasks.push(t);

    if (completedAt) {
      if (completedAt >= today && completedAt < tomorrow) todayCompleted++;
      if (completedAt >= startHeatmap && completedAt <= todayFull) {
        const key = `${completedAt.getFullYear()}-${String(completedAt.getMonth() + 1).padStart(2, '0')}-${String(completedAt.getDate()).padStart(2, '0')}`;
        taskCountsByDate[key] = (taskCountsByDate[key] || 0) + 1;
      }
      allDayTotals[completedAt.getDay()]++;
      totalHistoricCompleted++;
      const hr = completedAt.getHours();
      if (hr < 7) earlyBird = true;
      if (hr >= 0 && hr < 5) nightOwl = true;
      streakDatesSet.add(`${completedAt.getFullYear()}-${completedAt.getMonth()}-${completedAt.getDate()}`);
    }
  }

  const total = weekTasks.length;
  const completionRate = total > 0 ? Math.round((weekCompleted.length / total) * 100) : 0;

  const topicBreakdown = topics.map((sub) => ({
    id: sub.id, name: sub.name, color: sub.color,
    total: topicCounters[sub.id].total, completed: topicCounters[sub.id].completed,
    rate: topicCounters[sub.id].total > 0 ? Math.round((topicCounters[sub.id].completed / topicCounters[sub.id].total) * 100) : 0,
  }));

  const streak = computeStreak(streakDatesSet);

  const heatmapData = [];
  const cursor = new Date(startHeatmap);
  for (let i = 0; i < 168; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    heatmapData.push({ date: key, count: taskCountsByDate[key] || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const insights = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (totalHistoricCompleted > 0) {
    const maxIdx = allDayTotals.indexOf(Math.max(...allDayTotals));
    if (allDayTotals[maxIdx] > 0) insights.push(`You're historically most productive on ${dayNames[maxIdx]}s.`);
  }
  if (overdue.length > 3) insights.push(`${overdue.length} overdue tasks are slowing your momentum.`);
  else if (overdue.length === 0 && weekCompleted.length > 5) insights.push('Zero overdue tasks — you\'re running clean.');
  if (completionRate >= 80 && total > 5) insights.push('Over 80% of this week\'s load is done. Strong output.');
  else if (completionRate < 50 && total > 5) insights.push('Completion dropped below 50%. Try trimming your scope.');

  const perfectWeek = total >= 5 && completionRate === 100;

  return {
    weekStart, weekEnd, total, completed: weekCompleted.length, completionRate,
    pending: total - weekCompleted.length, overdue: overdue.length, overdueList: overdue,
    dailyLabels: days, dailyCompleted, dailyTotal, topicBreakdown, streak, todayTasks, todayCompleted,
    allTasks, heatmapData, insights, totalCompleted: totalHistoricCompleted, earlyBird, nightOwl, perfectWeek,
  };
}

/** Aggregate focus-session totals for gamification + analytics. */
export function computeFocusStats(sessions = []) {
  let minutes = 0;
  let completed = 0;
  for (const s of sessions) {
    if (s.status === 'completed') {
      completed++;
      minutes += Math.round((s.durationMs || 0) / 60000);
    }
  }
  return { focusSessions: completed, focusMinutes: minutes };
}
