// feedback.js — haptics, sound, and confetti for the reward loop.
// All effects are user-toggleable and respect prefers-reduced-motion.

import confetti from 'canvas-confetti';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Runtime preferences (wired to the theme store in theme.svelte.js)
export const fxPrefs = {
  haptics: true,
  sound: true,
  confetti: true,
};

export function setFxPrefs(p) {
  Object.assign(fxPrefs, p);
}

// ── Haptics ─────────────────────────────────────────────────────────────────
const PATTERNS = {
  tap: 8,
  success: [12, 40, 18],
  levelup: [18, 50, 18, 50, 30],
  warn: [30, 40, 30],
  error: [60],
};

export function haptic(kind = 'tap') {
  if (!fxPrefs.haptics) return;
  try { navigator.vibrate?.(PATTERNS[kind] ?? PATTERNS.tap); } catch {}
}

// ── Sound (WebAudio, no asset files) ─────────────────────────────────────────
let audioCtx = null;
function ctx() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  return audioCtx;
}

function blip(freq, startAt, dur, type = 'sine', gain = 0.05) {
  const ac = ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ac.currentTime + startAt);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + startAt + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + startAt + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime + startAt);
  osc.stop(ac.currentTime + startAt + dur);
}

const TUNES = {
  complete: [[660, 0, 0.12], [880, 0.08, 0.16]],
  levelup: [[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.2]],
  achievement: [[784, 0, 0.12], [988, 0.1, 0.12], [1175, 0.22, 0.25]],
  ring: [[587, 0, 0.1], [880, 0.09, 0.18]],
};

export function playSound(name = 'complete') {
  if (!fxPrefs.sound) return;
  const tune = TUNES[name] || TUNES.complete;
  try {
    ctx()?.resume?.();
    tune.forEach(([f, t, d]) => blip(f, t, d));
  } catch {}
}

// ── Confetti ─────────────────────────────────────────────────────────────────
function accentColors() {
  const root = getComputedStyle(document.documentElement);
  const a = root.getPropertyValue('--accent').trim() || '#5B8CFF';
  const a2 = root.getPropertyValue('--accent-2').trim() || '#22D3EE';
  return [a, a2, '#ffffff', '#FFD36E'];
}

export function burst(opts = {}) {
  if (!fxPrefs.confetti || prefersReducedMotion()) return;
  confetti({
    particleCount: 70,
    spread: 70,
    startVelocity: 38,
    gravity: 0.9,
    scalar: 0.9,
    ticks: 160,
    origin: { y: 0.7 },
    colors: accentColors(),
    disableForReducedMotion: true,
    ...opts,
  });
}

export function bigBurst() {
  if (!fxPrefs.confetti || prefersReducedMotion()) return;
  const colors = accentColors();
  const end = Date.now() + 700;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors, disableForReducedMotion: true });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors, disableForReducedMotion: true });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// ── Composite celebrations ───────────────────────────────────────────────────
export function celebrateTask() { haptic('success'); playSound('complete'); burst(); }
export function celebrateRing() { haptic('success'); playSound('ring'); burst({ particleCount: 100, spread: 90 }); }
export function celebrateLevelUp() { haptic('levelup'); playSound('levelup'); bigBurst(); }
export function celebrateAchievement() { haptic('levelup'); playSound('achievement'); burst({ particleCount: 120, spread: 100, startVelocity: 45 }); }
