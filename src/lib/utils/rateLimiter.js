// rateLimiter.js — client-side cooldown for sensitive actions (ported)

const attempts = new Map();

export function checkRateLimit(action, cooldownSeconds) {
  const now = Date.now();
  const lastAttempt = attempts.get(action) || 0;
  const elapsed = (now - lastAttempt) / 1000;

  if (elapsed < cooldownSeconds) {
    return { allowed: false, remainingSeconds: Math.ceil(cooldownSeconds - elapsed) };
  }
  attempts.set(action, now);
  return { allowed: true, remainingSeconds: 0 };
}

export function getCooldownStatus(action, cooldownSeconds) {
  const now = Date.now();
  const lastAttempt = attempts.get(action) || 0;
  const elapsed = (now - lastAttempt) / 1000;
  return {
    isCooldown: elapsed < cooldownSeconds,
    remainingSeconds: Math.max(0, Math.ceil(cooldownSeconds - elapsed)),
  };
}
