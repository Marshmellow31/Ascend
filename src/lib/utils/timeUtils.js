// timeUtils.js — HH:MM <-> minutes helpers (ported)

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function getDurationMinutes(startStr, endStr) {
  return timeToMinutes(endStr) - timeToMinutes(startStr);
}

export function isValidTimeRange(startStr, endStr) {
  return timeToMinutes(startStr) < timeToMinutes(endStr);
}
