/**
 * Simple client-side rate limiter for sensitive actions.
 * Prevents rapid-fire requests from bots or accidental double-clicks.
 * Note: For production-grade protection, this should be paired with server-side limiting.
 */

const attempts = new Map();

/**
 * Checks if an action is rate-limited.
 * @param {string} action - Unique name of the action (e.g., 'login', 'generate_ai_plan')
 * @param {number} cooldownSeconds - How long to wait between attempts
 * @returns {Object} - { allowed: boolean, remainingSeconds: number }
 */
export function checkRateLimit(action, cooldownSeconds) {
  const now = Date.now();
  const lastAttempt = attempts.get(action) || 0;
  const elapsed = (now - lastAttempt) / 1000;

  if (elapsed < cooldownSeconds) {
    return {
      allowed: false,
      remainingSeconds: Math.ceil(cooldownSeconds - elapsed)
    };
  }

  // Update last attempt time
  attempts.set(action, now);
  return { allowed: true, remainingSeconds: 0 };
}

/**
 * Gets the remaining cooldown for a specific action.
 */
export function getCooldownStatus(action, cooldownSeconds) {
  const now = Date.now();
  const lastAttempt = attempts.get(action) || 0;
  const elapsed = (now - lastAttempt) / 1000;
  
  return {
    isCooldown: elapsed < cooldownSeconds,
    remainingSeconds: Math.max(0, Math.ceil(cooldownSeconds - elapsed))
  };
}
