// ============================================================
// utils/taskScheduler.js
// ============================================================
import { timeToMinutes, minutesToTime, getDurationMinutes } from "./timeUtils.js";

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * Greedy algorithm to assign tasks to available study blocks.
 * 
 * @param {Array} tasks - Array of scheduler tasks (id, title, estimatedTime, priority, deadline)
 * @param {Object} weeklySchedule - The manual schedule object `{ Monday: [], Tuesday: [] ... }`
 * @returns {Object} - { scheduled: [], unscheduled: [] }
 */
export function generateStudyPlan(tasks, weeklySchedule) {
  // 0. Calculate "Effective Today" (5 AM to 5 AM)
  const now = new Date();
  // We subtract 5 hours to get the "effective" date for the plan
  const effectiveNow = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const effectiveDayIdx = effectiveNow.getDay(); 
  
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[effectiveNow.getDay()];
  const tomorrowName = dayNames[(effectiveNow.getDay() + 1) % 7];

  // 1. Sort tasks: Priority first, then Deadline
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const sortedTasks = [...tasks].sort((a, b) => {
    const pwA = priorityWeight[(a.priority || 'medium').toLowerCase()] || 0;
    const pwB = priorityWeight[(b.priority || 'medium').toLowerCase()] || 0;
    if (pwA !== pwB) return pwB - pwA;
    if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  // 2. Extract available Study blocks for the Effective Today only
  // This includes Today [5 AM - Midnight] and Tomorrow [Midnight - 5 AM]
  let availableBlocks = [];
  
  // Part A: Today's remaining blocks (from current time or 5 AM, whichever is later)
  const todayBlocks = weeklySchedule[todayName] || [];
  const currentMin = now.getHours() * 60 + now.getMinutes();
  
  // We only show blocks starting after 5 AM or CURRENT time
  const dayStartLimit = 5 * 60; // 5:00 AM
  
  todayBlocks.forEach(block => {
    if (block.type && block.type !== "Study") return;
    const startMin = timeToMinutes(block.start_time);
    const endMin = timeToMinutes(block.end_time);
    
    // Ignore blocks that ended before "now" or before 5 AM reset
    if (endMin <= currentMin) return;
    if (endMin <= dayStartLimit) return; 

    const effectiveStartMin = Math.max(startMin, currentMin, dayStartLimit);
    const duration = endMin - effectiveStartMin;
    
    if (duration > 0) {
      availableBlocks.push({
        id: block.id,
        title: block.title || "Study Block",
        startTimeMin: effectiveStartMin,
        endTimeMin: endMin,
        durationMin: duration,
        usedMin: 0,
        label: "Today"
      });
    }
  });

  // Part B: Blocks from "Tomorrow" that are before 5 AM (Transition window)
  const tomorrowBlocks = weeklySchedule[tomorrowName] || [];
  tomorrowBlocks.forEach(block => {
    if (block.type && block.type !== "Study") return;
    const startMin = timeToMinutes(block.start_time);
    const endMin = timeToMinutes(block.end_time);
    
    // Only include if it ends before 5 AM tomorrow
    if (startMin >= dayStartLimit) return; 
    
    const effectiveEndMin = Math.min(endMin, dayStartLimit);
    const duration = effectiveEndMin - startMin;

    if (duration > 0) {
      availableBlocks.push({
        id: block.id + "_next",
        title: block.title || "Study Block",
        startTimeMin: startMin,
        endTimeMin: effectiveEndMin,
        durationMin: duration,
        usedMin: 0,
        label: "Today", // Still "Today" because it's part of the effective day
        isLateNight: true
      });
    }
  });

  // Sort available blocks chronologically
  // Late night blocks (00:00-05:00) should come AFTER today's blocks (05:00-23:59)
  availableBlocks.sort((a, b) => {
    if (a.isLateNight && !b.isLateNight) return 1;
    if (!a.isLateNight && b.isLateNight) return -1;
    return a.startTimeMin - b.startTimeMin;
  });

  const scheduledTasks = [];
  const unscheduledTasks = [];

  // 3. Greedy Assignment
  for (let task of sortedTasks) {
    let remainingTime = task.estimatedTime;
    let allocations = [];

    for (let block of availableBlocks) {
      if (remainingTime <= 0) break;
      const availableTime = block.durationMin - block.usedMin;
      if (availableTime <= 0) continue;

      const timeToUse = Math.min(remainingTime, availableTime);
      const allocStartMin = block.startTimeMin + block.usedMin;
      const allocEndMin = allocStartMin + timeToUse;
      
      allocations.push({
        startTime: minutesToTime(allocStartMin),
        endTime: minutesToTime(allocEndMin),
        timeSpent: timeToUse,
        blockTitle: block.title
      });

      block.usedMin += timeToUse;
      remainingTime -= timeToUse;
    }

    if (remainingTime > 0) {
      unscheduledTasks.push({ ...task, remainingTimeUnscheduled: remainingTime });
    } else {
      scheduledTasks.push({ task: task, allocations: allocations });
    }
  }

  // 4. Group for UI (Strictly one day now)
  const planByDay = { "Today": [] };
  const orderedLabels = ["Today"];

  scheduledTasks.forEach(st => {
    st.allocations.forEach(alloc => {
      planByDay["Today"].push({
        taskId: st.task.id,
        taskTitle: st.task.title,
        priority: st.task.priority || 'Medium',
        startTime: alloc.startTime,
        endTime: alloc.endTime,
        timeSpent: alloc.timeSpent,
        blockTitle: alloc.blockTitle
      });
    });
  });
  
  planByDay["Today"].sort((a, b) => {
    // Handling sorting across the 12 AM boundary
    const aMins = timeToMinutes(a.startTime);
    const bMins = timeToMinutes(b.startTime);
    const isALate = aMins < (5 * 60);
    const isBLate = bMins < (5 * 60);
    if (isALate && !isBLate) return 1;
    if (!isALate && isBLate) return -1;
    return aMins - bMins;
  });

  return { planByDay, unscheduledTasks, orderedLabels };
}
