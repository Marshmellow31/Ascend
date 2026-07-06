// theme.svelte.js — theme mode, accent preset, glass/transparency, and FX prefs.
// Persists to localStorage (read pre-paint in index.html) and to the user profile.

import { cache } from '../utils/swrCache.js';
import { setFxPrefs } from '../utils/feedback.js';

export const ACCENTS = [
  { id: 'lime', label: 'Lime', from: '#CDFF4A', to: '#CDFF4A' },
  { id: 'violet', label: 'Violet', from: '#7C5CFF', to: '#7C5CFF' },
  { id: 'pink', label: 'Pink', from: '#FF5C8A', to: '#FF5C8A' },
  { id: 'cyan', label: 'Cyan', from: '#3DDCFF', to: '#3DDCFF' },
  { id: 'amber', label: 'Amber', from: '#FFB13D', to: '#FFB13D' },
];

/** Map legacy accent ids (pre-redesign) to the closest new hue. */
const LEGACY_ACCENTS = { indigo: 'cyan', emerald: 'lime', rose: 'pink' };
export function normalizeAccent(id) {
  if (ACCENTS.some((a) => a.id === id)) return id;
  return LEGACY_ACCENTS[id] || 'lime';
}

class ThemeStore {
  mode = $state(cache.get('theme_mode') || 'dark');     // 'dark' | 'light'
  accent = $state(normalizeAccent(cache.get('theme_accent') || 'lime'));
  glass = $state(cache.get('theme_glass') || 'on');      // 'on' | 'off'
  fx = $state(cache.get('theme_fx') || { haptics: true, sound: true, confetti: true });

  constructor() {
    setFxPrefs(this.fx);
  }

  apply() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', this.mode);
    root.setAttribute('data-accent', this.accent);
    if (this.glass === 'off') root.setAttribute('data-glass', 'off');
    else root.removeAttribute('data-glass');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#0A0A0E');
    setFxPrefs(this.fx);
  }

  setMode(mode) { this.mode = mode; cache.set('theme_mode', mode); this.apply(); }
  toggleMode() { this.setMode(this.mode === 'dark' ? 'light' : 'dark'); }
  setAccent(accent) { this.accent = normalizeAccent(accent); cache.set('theme_accent', this.accent); this.apply(); }
  setGlass(on) { this.glass = on ? 'on' : 'off'; cache.set('theme_glass', this.glass); this.apply(); }
  setFx(patch) { this.fx = { ...this.fx, ...patch }; cache.set('theme_fx', this.fx); setFxPrefs(this.fx); }

  /** Hydrate from a loaded user profile (prefs blob), keeping local choices as fallback. */
  hydrateFromProfile(profile) {
    if (!profile) return;
    if (profile.theme && profile.theme !== this.mode) this.setMode(profile.theme);
    const p = profile.prefs || {};
    if (p.accent) this.setAccent(p.accent);
    if (p.glass) this.setGlass(p.glass === 'on');
    if (p.fx) this.setFx(p.fx);
    else this.apply();
  }

  toPrefs() { return { accent: this.accent, glass: this.glass, fx: this.fx }; }
}

export const theme = new ThemeStore();
