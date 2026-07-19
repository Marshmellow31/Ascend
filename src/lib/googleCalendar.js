// googleCalendar.js — client-only Google Calendar sync for task due dates.
// Uses Google Identity Services (GIS) to get a short-lived OAuth access token
// scoped to calendar.events, then talks to the Calendar REST API directly with
// fetch. No backend involved — this is deliberate, since Cloud Functions can't
// make outbound calls on the Spark (free) Firebase plan.

import { googleCalendarStore, readGcalToken } from './stores/googleCalendar.svelte.js';
import { toast } from './stores/ui.svelte.js';

const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;
const EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

let tokenClient = null;

function ensureTokenClient() {
  if (tokenClient) return tokenClient;
  if (!window.google?.accounts?.oauth2) throw new Error('Google Identity Services not loaded');
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CALENDAR_CLIENT_ID is not set');
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: () => {}, // overridden per-call below
  });
  return tokenClient;
}

function requestToken({ prompt }) {
  return new Promise((resolve, reject) => {
    let client;
    try { client = ensureTokenClient(); } catch (err) { return reject(err); }
    client.callback = (resp) => {
      if (resp.error) return reject(new Error(resp.error));
      const expiresAt = Date.now() + (resp.expires_in || 3600) * 1000 - 60_000;
      googleCalendarStore.setToken(resp.access_token, expiresAt);
      resolve(resp.access_token);
    };
    client.requestAccessToken({ prompt });
  });
}

/** User-initiated connect flow — always shows the consent popup. */
export async function connect() {
  const token = await requestToken({ prompt: 'consent' });
  toast('Google Calendar connected', 'success');
  return token;
}

export function disconnect() {
  const entry = readGcalToken();
  if (entry?.token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(entry.token, () => {});
  }
  googleCalendarStore.clearToken();
}

/** Returns a valid access token, silently refreshing if possible, or null if not connected. */
export async function getValidToken() {
  const cached = readGcalToken();
  if (cached) return cached.token;
  if (!CLIENT_ID) return null;
  try {
    return await requestToken({ prompt: '' });
  } catch {
    googleCalendarStore.clearToken();
    return null;
  }
}

function buildEventBody(task) {
  const body = {
    summary: task.title,
    description: task.description || '',
  };
  if (task.dueTime) {
    const start = new Date(`${task.dueDateStr}T${task.dueTime}:00`);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    body.start = { dateTime: start.toISOString() };
    body.end = { dateTime: end.toISOString() };
    body.reminders = { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] };
  } else {
    const next = new Date(`${task.dueDateStr}T00:00:00`);
    next.setDate(next.getDate() + 1);
    body.start = { date: task.dueDateStr };
    body.end = { date: next.toISOString().slice(0, 10) };
    body.reminders = { useDefault: true };
  }
  return body;
}

/**
 * Creates or updates the calendar event for a task with a due date.
 * `task` needs: title, description, dueDateStr ("YYYY-MM-DD"), dueTime ("HH:MM" | null), gcalEventId.
 * Returns the event id on success, or null on failure (non-fatal — caller just skips persisting it).
 */
export async function syncTaskEvent(task) {
  const token = await getValidToken();
  if (!token || !task.dueDateStr) return null;

  const body = buildEventBody(task);
  const isUpdate = !!task.gcalEventId;
  const url = isUpdate ? `${EVENTS_URL}/${task.gcalEventId}` : EVENTS_URL;

  try {
    const res = await fetch(url, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 404 && isUpdate) {
      // Event was deleted on the Google side — recreate it.
      return syncTaskEvent({ ...task, gcalEventId: null });
    }
    if (!res.ok) throw new Error(`Calendar API ${res.status}`);
    const data = await res.json();
    return data.id;
  } catch (err) {
    console.error('[gcal] sync failed', err);
    return null;
  }
}

/** Best-effort delete; swallows errors since the event may already be gone or we're disconnected. */
export async function deleteTaskEvent(gcalEventId) {
  if (!gcalEventId) return;
  const token = await getValidToken();
  if (!token) return;
  try {
    await fetch(`${EVENTS_URL}/${gcalEventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.error('[gcal] delete failed', err);
  }
}
