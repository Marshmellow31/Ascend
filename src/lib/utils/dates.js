// dates.js — date/time helpers (ported + extended)

/** Parse Firebase Timestamp, plain object, or ISO string into a Date (or null). */
export function parseFbDate(v) {
  if (!v) return null;
  if (v.toDate) return v.toDate();
  if (v.seconds !== undefined) return new Date(v.seconds * 1000);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/** "Today" / "Tomorrow" / "Yesterday" / "Mon 5". */
export function formatDate(date) {
  const now = new Date();
  const d = new Date(date);
  if (d.toDateString() === now.toDateString()) return 'Today';
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Local YYYY-MM-DD (timezone-safe, unlike toISOString). */
export function toDateKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Effective "today" key with 5 AM rollover (one day runs 5am→5am). */
export function effectiveTodayStr() {
  const now = new Date();
  if (now.getHours() < 5) now.setDate(now.getDate() - 1);
  return toDateKey(now);
}

/** HH:MM string for "now". */
export function nowTimeStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

/** mm:ss from a millisecond duration. */
export function formatClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const friendlyAuthError = (code) => ({
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect password. Try again.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/email-already-in-use': 'That email is already registered.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/popup-closed-by-user': 'Sign-in cancelled.',
}[code] || `Something went wrong (${code}).`);
