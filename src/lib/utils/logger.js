// logger.js — security/behavior event logging to Firestore (ported, modular SDK)
import { db } from '../firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function logSecurityEvent(type, details = {}, uid = null) {
  try {
    await addDoc(collection(db, 'securityLogs'), {
      type: String(type).toUpperCase(),
      details,
      uid: uid || 'anonymous',
      userAgent: navigator.userAgent,
      timestamp: serverTimestamp(),
      clientDate: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[SecurityLog] Failed to record event:', err);
  }
}
