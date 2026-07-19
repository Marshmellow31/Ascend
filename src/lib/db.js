// db.js — Firestore data layer (ported to modular SDK). Same collections &
// sanitization as the original; adds gamification + focus-session reads.
//
// Naming note (kept from original): the `subjects` collection is what the UI
// calls "Topics"; the `topics` collection is "Subtopics".

import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp, Timestamp, runTransaction,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { toast } from './stores/ui.svelte.js';
import { connectivity } from './stores/connectivity.svelte.js';
import { logSecurityEvent } from './utils/logger.js';
import { sanitizeString, sanitizeNumber, sanitizeEnum, isValidDateStr } from './utils/sanitizer.js';
import { levelFromXp } from './logic/gamificationEngine.js';

function handleError(err, context = 'operation') {
  console.error(`DB Error (${context}):`, err);
  const isPermission = err.message && err.message.toLowerCase().includes('permission');
  logSecurityEvent(isPermission ? 'DB_PERMISSION_DENIED' : 'DB_ERROR', {
    context, code: err.code || 'unknown', message: err.message,
  });
  if (!connectivity.isOnline) return null; // offline → Firestore serves cache
  toast(isPermission ? 'Permission denied. Check database rules.' : `Failed to sync ${context}.`, 'error');
  throw err;
}

const byCreatedDesc = (a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
const byOrderThenCreated = (a, b) => {
  if ((a.order || 0) !== (b.order || 0)) return (a.order || 0) - (b.order || 0);
  return (a.createdAt?.toMillis?.() || Date.now()) - (b.createdAt?.toMillis?.() || Date.now());
};

// ── USER PROFILE ─────────────────────────────────────────────────────────────
export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) { return handleError(err, 'profile'); }
}

export async function updateUserProfile(uid, data) {
  try {
    const c = {};
    if (data.displayName !== undefined) c.displayName = sanitizeString(data.displayName, 50);
    if (data.photoURL !== undefined) c.photoURL = sanitizeString(data.photoURL, 2048);
    if (data.theme !== undefined) c.theme = sanitizeEnum(data.theme, ['dark', 'light'], 'dark');
    if (data.weekStartDay !== undefined) c.weekStartDay = sanitizeEnum(data.weekStartDay, ['monday', 'sunday'], 'monday');
    if (data.studyGoals !== undefined) c.studyGoals = sanitizeString(data.studyGoals, 1000);
    if (data.subjectsGrouped !== undefined) c.subjectsGrouped = !!data.subjectsGrouped;
    if (data.btechName !== undefined) c.btechName = sanitizeString(data.btechName, 150);
    if (data.btechStart !== undefined) c.btechStart = isValidDateStr(data.btechStart) ? data.btechStart : null;
    if (data.btechEnd !== undefined) c.btechEnd = isValidDateStr(data.btechEnd) ? data.btechEnd : null;
    if (data.prefs !== undefined) c.prefs = data.prefs; // theme/accent/fx/pomodoro prefs blob
    if (Object.keys(c).length > 0) {
      await updateDoc(doc(db, 'users', uid), { ...c, updatedAt: serverTimestamp() });
    }
  } catch (err) { handleError(err, 'update profile'); }
}

// ── SUBJECTS (UI: "Topics") ──────────────────────────────────────────────────
export async function createSubject(uid, { name, color, order = 0 }) {
  try {
    return await addDoc(collection(db, 'subjects'), {
      userId: uid, name: sanitizeString(name, 50), color: sanitizeString(color, 20) || '#5B8CFF',
      order: sanitizeNumber(order, 0, 100, 0), createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  } catch (err) { return handleError(err, 'create subject'); }
}
export async function getSubjects(uid) {
  try {
    const snap = await getDocs(query(collection(db, 'subjects'), where('userId', '==', uid)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrderThenCreated);
  } catch (err) { return handleError(err, 'load subjects') || []; }
}
export async function updateSubject(id, data) {
  try {
    const u = { updatedAt: serverTimestamp() };
    if (data.name !== undefined) u.name = sanitizeString(data.name, 50);
    if (data.color !== undefined) u.color = sanitizeString(data.color, 20);
    if (data.order !== undefined) u.order = sanitizeNumber(data.order, 0, 100, 0);
    await updateDoc(doc(db, 'subjects', id), u);
  } catch (err) { handleError(err, 'update subject'); }
}
export async function deleteSubject(id) {
  try { await deleteDoc(doc(db, 'subjects', id)); } catch (err) { handleError(err, 'delete subject'); }
}

// ── TOPICS (UI: "Subtopics") ─────────────────────────────────────────────────
export async function createTopic(uid, { subjectId, name, order = 0 }) {
  try {
    return await addDoc(collection(db, 'topics'), {
      userId: uid, subjectId: sanitizeString(subjectId, 100), name: sanitizeString(name, 50),
      order: sanitizeNumber(order, 0, 100, 0), createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  } catch (err) { return handleError(err, 'create topic'); }
}
export async function getTopics(uid, subjectId = null) {
  try {
    const constraints = [where('userId', '==', uid)];
    if (subjectId) constraints.push(where('subjectId', '==', subjectId));
    const snap = await getDocs(query(collection(db, 'topics'), ...constraints));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrderThenCreated);
  } catch (err) { return handleError(err, 'load topics') || []; }
}
export async function updateTopic(id, data) {
  try {
    const u = { updatedAt: serverTimestamp() };
    if (data.name !== undefined) u.name = sanitizeString(data.name, 50);
    if (data.order !== undefined) u.order = sanitizeNumber(data.order, 0, 100, 0);
    if (data.subjectId !== undefined) u.subjectId = sanitizeString(data.subjectId, 100);
    await updateDoc(doc(db, 'topics', id), u);
  } catch (err) { handleError(err, 'update topic'); }
}
export async function deleteTopic(id) {
  try { await deleteDoc(doc(db, 'topics', id)); } catch (err) { handleError(err, 'delete topic'); }
}

// ── TASKS ────────────────────────────────────────────────────────────────────
export async function createTask(uid, t) {
  try {
    return await addDoc(collection(db, 'tasks'), {
      userId: uid,
      subjectId: sanitizeString(t.subjectId, 100),
      topicId: sanitizeString(t.topicId, 100),
      title: sanitizeString(t.title, 100),
      description: sanitizeString(t.description || '', 1000),
      priority: sanitizeEnum(t.priority?.toLowerCase(), ['high', 'medium', 'low'], 'medium'),
      dueDate: isValidDateStr(t.dueDate) ? Timestamp.fromDate(new Date(t.dueDate)) : null,
      dueTime: /^\d{2}:\d{2}$/.test(t.dueTime || '') ? t.dueTime : null,
      gcalEventId: t.gcalEventId || null,
      isCompleted: false, completedAt: null,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  } catch (err) { return handleError(err, 'create task'); }
}
export async function getTasks(uid, filters = {}) {
  try {
    const constraints = [where('userId', '==', uid)];
    if (filters.subjectId) constraints.push(where('subjectId', '==', filters.subjectId));
    if (filters.topicId) constraints.push(where('topicId', '==', filters.topicId));
    if (filters.isCompleted !== undefined) constraints.push(where('isCompleted', '==', filters.isCompleted));
    if (filters.priority) constraints.push(where('priority', '==', filters.priority));
    const snap = await getDocs(query(collection(db, 'tasks'), ...constraints));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byCreatedDesc);
  } catch (err) { return handleError(err, 'load tasks') || []; }
}
export async function updateTask(id, data) {
  try {
    const u = { updatedAt: serverTimestamp() };
    if (data.title !== undefined) u.title = sanitizeString(data.title, 100);
    if (data.description !== undefined) u.description = sanitizeString(data.description, 1000);
    if (data.priority !== undefined) u.priority = sanitizeEnum(data.priority?.toLowerCase(), ['high', 'medium', 'low'], 'medium');
    if (data.dueDate !== undefined) u.dueDate = isValidDateStr(data.dueDate) ? Timestamp.fromDate(new Date(data.dueDate)) : null;
    if (data.dueTime !== undefined) u.dueTime = /^\d{2}:\d{2}$/.test(data.dueTime || '') ? data.dueTime : null;
    if (data.gcalEventId !== undefined) u.gcalEventId = data.gcalEventId || null;
    if (data.isCompleted !== undefined) u.isCompleted = !!data.isCompleted;
    if (data.subjectId !== undefined) u.subjectId = sanitizeString(data.subjectId, 100);
    if (data.topicId !== undefined) u.topicId = sanitizeString(data.topicId, 100);
    await updateDoc(doc(db, 'tasks', id), u);
  } catch (err) { handleError(err, 'update task'); }
}
export async function completeTask(id) {
  try { await updateDoc(doc(db, 'tasks', id), { isCompleted: true, completedAt: serverTimestamp(), updatedAt: serverTimestamp() }); }
  catch (err) { handleError(err, 'complete task'); }
}
export async function reopenTask(id) {
  try { await updateDoc(doc(db, 'tasks', id), { isCompleted: false, completedAt: null, updatedAt: serverTimestamp() }); }
  catch (err) { handleError(err, 'reopen task'); }
}
export async function deleteTask(id) {
  try { await deleteDoc(doc(db, 'tasks', id)); } catch (err) { handleError(err, 'delete task'); }
}

// ── FOCUS SESSIONS ───────────────────────────────────────────────────────────
export async function createFocusSession(uid, data) {
  try {
    return await addDoc(collection(db, 'focusSessions'), {
      userId: uid, blockId: data.blockId || null, taskId: data.taskId || null,
      label: sanitizeString(data.label || 'Deep Work', 100),
      startTime: serverTimestamp(), endTime: null, durationMs: data.durationMs || 0,
      plannedMs: data.plannedMs || 0, distractionCount: 0, notes: '',
      status: data.status || 'active',
    });
  } catch (err) { return handleError(err, 'create focus session'); }
}
export async function updateFocusSession(id, data) {
  try {
    if (data.status === 'completed' && !data.endTime) data.endTime = serverTimestamp();
    await updateDoc(doc(db, 'focusSessions', id), data);
  } catch (err) { handleError(err, 'update focus session'); }
}
export async function getFocusSessions(uid) {
  try {
    const snap = await getDocs(query(collection(db, 'focusSessions'), where('userId', '==', uid)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) { return handleError(err, 'load focus sessions') || []; }
}

// ── NOTES ────────────────────────────────────────────────────────────────────
export async function createNote(uid, n) {
  try {
    return await addDoc(collection(db, 'notes'), {
      userId: uid, title: sanitizeString(n.title || '', 100), content: sanitizeString(n.content || '', 2000),
      color: sanitizeString(n.color || '#5B8CFF', 20), pinned: !!n.pinned,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  } catch (err) { return handleError(err, 'create note'); }
}
export async function getNotes(uid) {
  try {
    const snap = await getDocs(query(collection(db, 'notes'), where('userId', '==', uid)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0);
    });
  } catch (err) { return handleError(err, 'load notes') || []; }
}
export async function updateNote(id, data) {
  try {
    const u = { updatedAt: serverTimestamp() };
    if (data.title !== undefined) u.title = sanitizeString(data.title, 100);
    if (data.content !== undefined) u.content = sanitizeString(data.content, 2000);
    if (data.color !== undefined) u.color = sanitizeString(data.color, 20);
    if (data.pinned !== undefined) u.pinned = !!data.pinned;
    await updateDoc(doc(db, 'notes', id), u);
  } catch (err) { handleError(err, 'update note'); }
}
export async function deleteNote(id) {
  try { await deleteDoc(doc(db, 'notes', id)); } catch (err) { handleError(err, 'delete note'); }
}

// ── GAMIFICATION (gamification/{uid}) ────────────────────────────────────────
const GAMIFICATION_SEED = { xp: 0, level: 1, achievements: {}, lastActiveDate: null, streakFreezes: 0, dailyGoalTarget: 3 };

export async function getGamification(uid) {
  try {
    const snap = await getDoc(doc(db, 'gamification', uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) { return handleError(err, 'load gamification'); }
}
export async function ensureGamification(uid) {
  const ref = doc(db, 'gamification', uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
    const seed = { uid, ...GAMIFICATION_SEED, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    await setDoc(ref, seed);
    return seed;
  } catch (err) { return handleError(err, 'init gamification') || { uid, ...GAMIFICATION_SEED }; }
}
/** Transactionally add XP and recompute level. Returns the updated record. */
export async function addXp(uid, amount) {
  const ref = doc(db, 'gamification', uid);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const cur = snap.exists() ? snap.data() : { uid, ...GAMIFICATION_SEED };
      const xp = Math.max(0, (cur.xp || 0) + amount);
      const level = levelFromXp(xp);
      const leveledUp = level > (cur.level || 1);
      tx.set(ref, { uid, xp, level, updatedAt: serverTimestamp() }, { merge: true });
      return { ...cur, uid, xp, level, leveledUp, previousLevel: cur.level || 1 };
    });
  } catch (err) { handleError(err, 'add xp'); return null; }
}
export async function updateGamification(uid, data) {
  try { await setDoc(doc(db, 'gamification', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true }); }
  catch (err) { handleError(err, 'update gamification'); }
}
export async function unlockAchievements(uid, ids = []) {
  if (!ids.length) return;
  const patch = {};
  ids.forEach((id) => { patch[`achievements.${id}`] = Date.now(); });
  try { await updateDoc(doc(db, 'gamification', uid), { ...patch, updatedAt: serverTimestamp() }); }
  catch (err) { handleError(err, 'unlock achievement'); }
}

// ── REAL-TIME SUBSCRIPTIONS ──────────────────────────────────────────────────
export function subscribeToTasks(uid, cb) {
  return onSnapshot(query(collection(db, 'tasks'), where('userId', '==', uid)),
    (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => { if (connectivity.isOnline) console.error('[DB] task sub error', err); });
}
