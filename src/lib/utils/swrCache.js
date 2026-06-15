// swrCache.js — Stale-While-Revalidate cache (memory + localStorage). Ported from
// cacheManager.js; keeps the same revision-based change detection.

class SwrCache {
  constructor() {
    this.memory = new Map();
    this.prefix = 'swr_cache_';
    this.version = '3.0';
    this.defaultTTL = 5 * 60 * 1000;
    this._listeners = new Map();
    this._rev = 0;
    this._cleanup();
  }

  get(key) {
    const mem = this.memory.get(key);
    if (mem && mem.version === this.version) return mem.data;
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (raw) {
        const entry = JSON.parse(raw);
        if (entry.version === this.version) {
          this.memory.set(key, entry);
          return entry.data;
        }
        localStorage.removeItem(this.prefix + key);
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  set(key, data) {
    this._rev++;
    const entry = { data, timestamp: Date.now(), version: this.version, revision: this._rev };
    this.memory.set(key, entry);
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        this._cleanup(true);
        try { localStorage.setItem(this.prefix + key, JSON.stringify(entry)); } catch {}
      }
    }
    this._notify(key, data);
    return this._rev;
  }

  getRevision(key) { const e = this.memory.get(key); return e ? (e.revision || 0) : null; }
  hasChanged(key, prev) { const cur = this.getRevision(key); return cur === null ? true : cur !== prev; }
  isValid(key, ttl = this.defaultTTL) { const e = this.memory.get(key); return e ? (Date.now() - e.timestamp) < ttl : false; }

  onChange(key, cb) {
    if (!this._listeners.has(key)) this._listeners.set(key, new Set());
    this._listeners.get(key).add(cb);
    return () => this._listeners.get(key)?.delete(cb);
  }

  invalidatePrefix(prefix) {
    for (const k of this.memory.keys()) if (k.startsWith(prefix)) this.memory.delete(k);
    try {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.prefix + prefix)) toRemove.push(k);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }

  clearAll() { this.memory.clear(); this.invalidatePrefix(''); }

  _notify(key, data) {
    this._listeners.get(key)?.forEach((cb) => { try { cb(data); } catch {} });
  }

  _cleanup(force = false) {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.prefix)) keys.push(k);
      }
      if (force) { keys.forEach((k) => localStorage.removeItem(k)); return; }
      const oneDay = 24 * 60 * 60 * 1000;
      keys.forEach((k) => {
        try {
          const entry = JSON.parse(localStorage.getItem(k));
          if (entry && Date.now() - entry.timestamp > oneDay) localStorage.removeItem(k);
        } catch {}
      });
    } catch {}
  }
}

export const cache = new SwrCache();
