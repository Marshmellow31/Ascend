/**
 * auth_ui.js — Auth form submission and screen transition logic
 */
import { $ } from "./utils.js";
import { logIn, signUp, resetPassword, logInWithGoogle, sendVerification, reloadUser, logOut } from "../auth.js";

export function initAuthForms(onSuccess, showLanding) {
  // ── Login ─────────────────────────────────────────────────
  $("form-login")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = $("login-error");
    errEl.classList.add("hidden");
    const btn = $("btn-login");
    btn.textContent = "Signing in…";
    btn.disabled = true;
    try {
      const user = await logIn($("login-email").value.trim(), $("login-password").value);
      await onSuccess(user);
    } catch (err) {
      import("./utils.js").then(({ friendlyError }) => {
        errEl.textContent = friendlyError(err.code);
        errEl.classList.remove("hidden");
        btn.textContent = "Sign In";
        btn.disabled = false;
      });
    }
  });

  // ── Signup ────────────────────────────────────────────────
  $("form-signup")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = $("signup-error");
    errEl.classList.add("hidden");
    const btn = $("btn-signup");
    btn.textContent = "Creating…";
    btn.disabled = true;
    try {
      const user = await signUp(
        $("signup-email").value.trim(),
        $("signup-password").value,
        $("signup-name").value.trim() || "Student"
      );
      await onSuccess(user);
    } catch (err) {
      import("./utils.js").then(({ friendlyError }) => {
        errEl.textContent = friendlyError(err.code);
        errEl.classList.remove("hidden");
        btn.textContent = "Create Account";
        btn.disabled = false;
      });
    }
  });

  // ── Password reset ────────────────────────────────────────
  $("form-forgot")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msgEl = $("forgot-msg");
    try {
      await resetPassword($("forgot-email").value.trim());
      msgEl.style.color = "var(--success)";
      msgEl.textContent = "✓ Reset link sent! Check your inbox.";
      msgEl.classList.remove("hidden");
    } catch (err) {
      import("./utils.js").then(({ friendlyError }) => {
        msgEl.style.color = "var(--error)";
        msgEl.textContent = friendlyError(err.code);
        msgEl.classList.remove("hidden");
      });
    }
  });

  // ── Google Sign In ────────────────────────────────────────
  const handleGoogleAuth = async () => {
    try {
      const user = await logInWithGoogle();
      await onSuccess(user);
    } catch (err) {
      console.error("Google Auth Error:", err);
    }
  };

  $("btn-google-login")?.addEventListener("click", handleGoogleAuth);
  $("btn-google-signup")?.addEventListener("click", handleGoogleAuth);

  // ── Verification Screen ──────────────────────────────────
  $("btn-resend-verify")?.addEventListener("click", async () => {
    const btn = $("btn-resend-verify");
    const originalText = btn.textContent;
    btn.textContent = "Sending…";
    btn.disabled = true;
    try {
      const { auth } = await import("../firebase-config.js");
      await sendVerification(auth.currentUser);
      btn.textContent = "✓ Sent! Check inbox";
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 5000);
    } catch (err) {
      btn.textContent = "Error. Try again?";
      btn.disabled = false;
    }
  });

  $("btn-check-verify")?.addEventListener("click", async () => {
    const btn = $("btn-check-verify");
    btn.textContent = "Checking…";
    btn.disabled = true;
    try {
      const { auth } = await import("../firebase-config.js");
      const user = await reloadUser(auth.currentUser);
      if (user?.emailVerified) {
        await onSuccess(user);
      } else {
        const subtitle = document.querySelector("#auth-verify .auth-subtitle");
        if (subtitle) {
          subtitle.textContent = "Not verified yet. Please click the link in your email.";
          subtitle.style.color = "var(--error)";
          setTimeout(() => {
            subtitle.textContent = "We've sent a verification link to your inbox. Please click it to continue.";
            subtitle.style.color = "";
          }, 3000);
        }
        btn.textContent = "I've Verified My Email";
        btn.disabled = false;
      }
    } catch (err) {
      btn.textContent = "I've Verified My Email";
      btn.disabled = false;
    }
  });

  $("link-verify-to-login")?.addEventListener("click", async (e) => {
    e.preventDefault();
    await logOut();
    showSubPage("auth-login");
  });

  // ── Navigation between auth screens ──────────────────────
  const showSubPage = (id) => {
    ["auth-login", "auth-signup", "auth-forgot", "auth-verify"].forEach((x) =>
      document.getElementById(x)?.classList.toggle("hidden", x !== id)
    );
  };
  $("link-to-signup")?.addEventListener("click", (e) => { e.preventDefault(); showSubPage("auth-signup"); });
  $("link-to-login")?.addEventListener("click",  (e) => { e.preventDefault(); showSubPage("auth-login"); });
  $("link-forgot-pw")?.addEventListener("click", (e) => { e.preventDefault(); showSubPage("auth-forgot"); });
  $("link-back-to-login")?.addEventListener("click", (e) => { e.preventDefault(); showSubPage("auth-login"); });

  // ── Close auth (Symmetric Exit Animation) ────────────────
  document.querySelectorAll(".auth-close-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const visibleAuth = ["auth-login", "auth-signup", "auth-forgot", "auth-verify"]
        .map(id => $(id))
        .find(el => el && !el.classList.contains("hidden"));

      if (visibleAuth) {
        visibleAuth.classList.add("auth-slide-out");
        setTimeout(() => {
          visibleAuth.classList.remove("auth-slide-out");
          showLanding(true); // show landing with enter animation
        }, 280);
      } else {
        showLanding();
      }
    });
  });
}
