// ============================================================
// auth.js — Firebase Authentication helpers
// ============================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged as _onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  reload,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth, db } from "./firebase-config.js";
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { logSecurityEvent } from "./js/utils/logger.js";
import { checkRateLimit } from "./utils/rateLimiter.js";
import { showSnackbar } from "./snackbar.js";

// ── Google Sign In ─────────────────────────────────────────────────────────────
export async function logInWithGoogle() {
  const { allowed, remainingSeconds } = checkRateLimit("auth_google", 10);
  if (!allowed) {
    showSnackbar(`Please wait ${remainingSeconds}s before trying again.`, "warning");
    logSecurityEvent("RATE_LIMIT_EXCEEDED", { action: "auth_google" });
    throw new Error("RATE_LIMIT");
  }

  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;

  // Check if profile exists; if not, create it
  const profileRef = doc(db, "users", user.uid);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    await setDoc(profileRef, {
      uid: user.uid,
      displayName: user.displayName || "Student",
      email: user.email,
      photoURL: user.photoURL || null,
      theme: "dark",
      weekStartDay: "monday",
      notificationEnabled: false,
      reminderSettings: {
        defaultMinutesBefore: 30,
      },
      studyGoals: "",
      subjectsGrouped: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  logSecurityEvent("AUTH_LOGIN_GOOGLE_SUCCESS", { email: user.email }, user.uid);
  return user;
}

// ── Sign up with email/password ───────────────────────────────────────────────
export async function signUp(email, password, displayName) {
  const { allowed, remainingSeconds } = checkRateLimit("auth_signup", 30);
  if (!allowed) {
    showSnackbar(`Please wait ${remainingSeconds}s before creating another account.`, "warning");
    logSecurityEvent("RATE_LIMIT_EXCEEDED", { action: "auth_signup", email });
    throw new Error("RATE_LIMIT");
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Update Firebase Auth profile
  await updateProfile(user, { displayName });

  // Create Firestore user profile document
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    displayName,
    email: user.email,
    photoURL: user.photoURL || null,
    theme: "dark",
    weekStartDay: "monday",
    notificationEnabled: false,
    reminderSettings: {
      defaultMinutesBefore: 30,
    },
    studyGoals: "",
    subjectsGrouped: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Send verification email (non-blocking)
  sendVerification(user).catch(err => console.error("Email verification error:", err));

  logSecurityEvent("AUTH_SIGNUP_SUCCESS", { email: user.email }, user.uid);
  return user;
}

// ── Send Verification Email ──────────────────────────────────────────────────
export async function sendVerification(user) {
  if (!user || user.emailVerified) return;
  await sendEmailVerification(user);
}

// ── Reload User Data ─────────────────────────────────────────────────────────
export async function reloadUser(user) {
  if (!user) return null;
  await reload(user);
  return auth.currentUser;
}

// ── Log in ───────────────────────────────────────────────────────────────────
export async function logIn(email, password) {
  const { allowed, remainingSeconds } = checkRateLimit("auth_login", 7);
  if (!allowed) {
    showSnackbar(`Too many attempts. Wait ${remainingSeconds}s.`, "warning");
    logSecurityEvent("RATE_LIMIT_EXCEEDED", { action: "auth_login", email });
    throw new Error("RATE_LIMIT");
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    logSecurityEvent("AUTH_LOGIN_SUCCESS", { email: credential.user.email }, credential.user.uid);
    return credential.user;
  } catch (err) {
    logSecurityEvent("AUTH_LOGIN_FAILURE", { email, reason: err.code || err.message });
    throw err;
  }
}

// ── Log out ──────────────────────────────────────────────────────────────────
export async function logOut() {
  await signOut(auth);
}

// ── Password reset ────────────────────────────────────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// ── Auth state listener ───────────────────────────────────────────────────────
export function onAuthStateChanged(callback) {
  return _onAuthStateChanged(auth, callback);
}

// Note: getUserProfile and updateUserProfile are in db.js
// Do not duplicate them here.
