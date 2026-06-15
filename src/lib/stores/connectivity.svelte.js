// connectivity.svelte.js — reactive online/offline state (rune-based).

class Connectivity {
  online = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.online = true; });
      window.addEventListener('offline', () => { this.online = false; });
    }
  }

  get isOnline() { return this.online; }
}

export const connectivity = new Connectivity();
