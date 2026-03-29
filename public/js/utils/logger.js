// ============================================================
// logger.js — Security and behavior monitoring utility
// ============================================================

import { db } from "../../firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * Logs a security or system event to Firestore.
 * This is used for monitoring auth attempts, API errors, and unusual patterns.
 * 
 * @param {string} type - The broad category of the event (e.g., 'AUTH_FAILURE', 'DB_ERROR')
 * @param {Object} details - Specific event data (e.g., { email: 'user@example.com' })
 * @param {string|null} uid - (Optional) The UID of the user if authenticated
 */
export async function logSecurityEvent(type, details = {}, uid = null) {
  try {
    // We use a dedicated collection for security eyes-only logs
    const logRef = collection(db, "securityLogs");
    
    await addDoc(logRef, {
      type: type.toUpperCase(),
      details,
      uid: uid || 'anonymous',
      userAgent: navigator.userAgent,
      timestamp: serverTimestamp(),
      // Add a client-side ISO date for easier debugging in Console
      clientDate: new Date().toISOString() 
    });
    
    console.log(`[SecurityLog] ${type} recorded.`);
  } catch (err) {
    // We don't throw here to avoid circular error loops, 
    // but we log to console for visibility.
    console.error("[SecurityLog] Failed to record event:", err);
  }
}
