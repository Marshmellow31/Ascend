// auth.svelte.js — reactive auth + profile state with email-verification gate.
import { onAuthStateChanged } from '../auth.js';
import { getUserProfile } from '../db.js';
import { cache } from '../utils/swrCache.js';
import { theme } from './theme.svelte.js';
import { gamification } from './gamification.svelte.js';

class AuthStore {
  status = $state('loading'); // 'loading' | 'unauth' | 'verify' | 'ready'
  user = $state(null);
  profile = $state(null);
  _started = false;

  init() {
    if (this._started) return;
    this._started = true;
    onAuthStateChanged(async (user) => {
      if (!user) { this.user = null; this.profile = null; this.status = 'unauth'; return; }

      const isPasswordUser = user.providerData.some((p) => p.providerId === 'password');
      if (isPasswordUser && !user.emailVerified) { this.user = user; this.status = 'verify'; return; }

      this.user = user;
      const cached = cache.get(`profile_${user.uid}`);
      if (cached) { this.profile = cached; theme.hydrateFromProfile(cached); }
      this.status = 'ready';

      // Background: gamification + fresh profile
      gamification.load(user.uid);
      const fresh = await getUserProfile(user.uid);
      if (fresh) {
        this.profile = fresh;
        cache.set(`profile_${user.uid}`, fresh);
        theme.hydrateFromProfile(fresh);
      }
    });
  }

  setProfile(p) {
    this.profile = p;
    if (this.user) cache.set(`profile_${this.user.uid}`, p);
  }

  get uid() { return this.user?.uid || null; }
}

export const authStore = new AuthStore();
