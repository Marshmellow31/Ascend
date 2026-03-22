// ============================================================
// firebase-config.js
// Firebase initialization — replace placeholder values with
// your real project config before deploying.
// In Vercel, set these as Environment Variables and inject
// them at build time, OR just paste your real values here
// since Firebase client config is not secret.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getMessaging, isSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

// ─── Replace these values with your actual Firebase project config ───────────
const firebaseConfig = {
  apiKey: "AIzaSyCwKJw72RXUzvvBLdxI3WlfCoWvFPmvv3Y",
  authDomain: "student-planner-95ed4.firebaseapp.com",
  projectId: "student-planner-95ed4",
  storageBucket: "student-planner-95ed4.firebasestorage.app",
  messagingSenderId: "224841353755",
  appId: "1:224841353755:web:0defe4eccd9a222a9646be",
  measurementId: "G-GK068Y52DV"
};

// VAPID public key for Web Push (FCM)
export const VAPID_KEY = "BMzrmWa2Z1MhacOyQOh--xfHnUNYjOmVPHZqd9ajR-e9PsOz2j6QkC7FX-XHYg4uOKZ7I-AGY2-IdRoc9-sF1pM";

// ─── Initialize Firebase ──────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence (cache for service worker shell)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Firestore persistence: multiple tabs open.");
  } else if (err.code === "unimplemented") {
    console.warn("Firestore persistence: not supported in this browser.");
  }
});

// Messaging — only available in browsers that support it (iOS 16.4+ when installed)
export let messaging = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});

export default app;
