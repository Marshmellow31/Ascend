// googleCalendar.svelte.js — connection state for the Google Calendar sync feature.
// The OAuth access token itself lives in sessionStorage (short-lived, never persisted
// to Firestore or localStorage); this store just tracks whether we're "connected".

const STORAGE_KEY = 'gcal_token';

function readToken() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry.token || !entry.expiresAt || entry.expiresAt <= Date.now()) return null;
    return entry;
  } catch { return null; }
}

class GoogleCalendarStore {
  connected = $state(!!readToken());

  refresh() { this.connected = !!readToken(); }

  setToken(token, expiresAt) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt })); } catch {}
    this.connected = true;
  }

  clearToken() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    this.connected = false;
  }
}

export const googleCalendarStore = new GoogleCalendarStore();
export { STORAGE_KEY as GCAL_STORAGE_KEY, readToken as readGcalToken };
