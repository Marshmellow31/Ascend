// auth.js — Firebase Auth helpers (ported to modular SDK).
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, updateProfile, onAuthStateChanged as _onAuthStateChanged,
  GoogleAuthProvider, signInWithPopup, sendEmailVerification, reload,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase.js';
import { logSecurityEvent } from './utils/logger.js';
import { checkRateLimit } from './utils/rateLimiter.js';
import { toast } from './stores/ui.svelte.js';

function defaultProfile(user, displayName) {
  return {
    uid: user.uid,
    displayName: displayName || user.displayName || 'Student',
    email: user.email,
    photoURL: user.photoURL || null,
    theme: 'dark',
    weekStartDay: 'monday',
    studyGoals: '',
    subjectsGrouped: true,
    prefs: { accent: 'indigo', glass: 'on', fx: { haptics: true, sound: true, confetti: true } },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function logInWithGoogle() {
  const { allowed, remainingSeconds } = checkRateLimit('auth_google', 10);
  if (!allowed) { toast(`Please wait ${remainingSeconds}s before trying again.`, 'warning'); throw new Error('RATE_LIMIT'); }
  const provider = new GoogleAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) await setDoc(ref, defaultProfile(user));
  logSecurityEvent('AUTH_LOGIN_GOOGLE_SUCCESS', { email: user.email }, user.uid);
  return user;
}

export async function signUp(email, password, displayName) {
  const { allowed, remainingSeconds } = checkRateLimit('auth_signup', 30);
  if (!allowed) { toast(`Please wait ${remainingSeconds}s before creating another account.`, 'warning'); throw new Error('RATE_LIMIT'); }
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  await setDoc(doc(db, 'users', user.uid), defaultProfile(user, displayName));
  sendVerification(user).catch((err) => console.error('Email verification error:', err));
  logSecurityEvent('AUTH_SIGNUP_SUCCESS', { email: user.email }, user.uid);
  return user;
}

export async function sendVerification(user) {
  if (!user || user.emailVerified) return;
  await sendEmailVerification(user);
}
export async function reloadUser(user) {
  if (!user) return null;
  await reload(user);
  return auth.currentUser;
}

export async function logIn(email, password) {
  const { allowed, remainingSeconds } = checkRateLimit('auth_login', 7);
  if (!allowed) { toast(`Too many attempts. Wait ${remainingSeconds}s.`, 'warning'); throw new Error('RATE_LIMIT'); }
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    logSecurityEvent('AUTH_LOGIN_SUCCESS', { email: user.email }, user.uid);
    return user;
  } catch (err) {
    logSecurityEvent('AUTH_LOGIN_FAILURE', { email, reason: err.code || err.message });
    throw err;
  }
}

export async function logOut() { await signOut(auth); }
export async function resetPassword(email) { await sendPasswordResetEmail(auth, email); }
export function onAuthStateChanged(cb) { return _onAuthStateChanged(auth, cb); }
