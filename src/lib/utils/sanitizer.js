// sanitizer.js — input cleaning + validation (ported)

export function sanitizeString(val, max = 500) {
  if (typeof val !== 'string') return '';
  let cleaned = val.replace(/<\/?[^>]+(>|$)/g, '');
  cleaned = cleaned.trim();
  return cleaned.substring(0, max);
}

export function sanitizeNumber(val, min = 0, max = 999999, def = 0) {
  const n = parseInt(val, 10);
  if (isNaN(n)) return def;
  return Math.min(Math.max(n, min), max);
}

export function sanitizeEnum(val, allowed, def) {
  if (!allowed.includes(val)) return def;
  return val;
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidDateStr(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
}

/** Escape HTML for safe interpolation into innerHTML (used rarely; Svelte escapes by default). */
export function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
