// ============================================================
// app.js — Main router, auth watcher, global state
// ============================================================

// ── Splash caption + icon (runs immediately, before Firebase) ─
(function initSplashCaption() {
  const h = new Date().getHours();

  // ── Time-based icon SVGs ───────────────────────────────────
  const svgs = {
    // 🌙 Night / Late night  (8pm–5am) — crescent moon
    moon: `<svg class="splash-svg-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M38 14 C24 16 16 26 18 38 C20 50 32 56 44 52 C34 52 26 44 26 32 C26 20 34 14 38 14 Z"
        stroke="#aaaaaa" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
    </svg>`,

    // 🌅 Sunrise (5–8am) — arc rising above horizon with upward rays
    sunrise: `<svg class="splash-svg-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="8"  y1="44" x2="56" y2="44" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M18 44 A14 14 0 0 1 46 44" stroke="#cccccc" stroke-width="2" stroke-linecap="round" fill="none"/>
      <line x1="32" y1="24" x2="32" y2="18" stroke="#999999" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="21" y1="28" x2="17"  y2="24" stroke="#666666" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="43" y1="28" x2="47"  y2="24" stroke="#666666" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="15" y1="37" x2="10"  y2="36" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="49" y1="37" x2="54"  y2="36" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,

    // ☀️ Full day (8am–5pm) — full circle with rays all around
    sun: `<svg class="splash-svg-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="11" stroke="#cccccc" stroke-width="2" fill="none"/>
      <line x1="32" y1="8"  x2="32" y2="13" stroke="#888888" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="32" y1="51" x2="32" y2="56" stroke="#888888" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="8"  y1="32" x2="13" y2="32" stroke="#888888" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="51" y1="32" x2="56" y2="32" stroke="#888888" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="15" y1="15" x2="19" y2="19" stroke="#555555" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="45" y1="45" x2="49" y2="49" stroke="#555555" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="49" y1="15" x2="45" y2="19" stroke="#555555" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="19" y1="45" x2="15" y2="49" stroke="#555555" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,

    // 🌇 Sunset (5–8pm) — sun setting below the horizon line
    sunset: `<svg class="splash-svg-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="8"  y1="36" x2="56" y2="36" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M18 36 A14 14 0 0 0 46 36" stroke="#cccccc" stroke-width="2" stroke-linecap="round" fill="none"/>
      <line x1="32" y1="52" x2="32" y2="46" stroke="#999999" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="21" y1="48" x2="17"  y2="52" stroke="#666666" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="43" y1="48" x2="47"  y2="52" stroke="#666666" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="15" y1="30" x2="10"  y2="29" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="49" y1="30" x2="54"  y2="29" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
  };

  // Pick correct icon
  const iconKey = h < 5 || h >= 20 ? "moon"
                : h < 8            ? "sunrise"
                : h < 17           ? "sun"
                :                    "sunset";

  const iconEl = document.getElementById("splash-icon");
  if (iconEl) iconEl.innerHTML = svgs[iconKey];

  // ── Time-based captions ────────────────────────────────────
  const captions = h < 5
    ? [ "Rest well. Tomorrow belongs to the prepared.",
        "The night is quiet. So is focus.",
        "Even in silence, growth continues." ]
    : h < 9
    ? [ "Morning clarity is a superpower. Use it.",
        "The early hours don't lie — make them count.",
        "Sunrise. A blank slate. Go.",
        "What you do before 9am shapes your entire day." ]
    : h < 12
    ? [ "Your best thinking happens now. Protect it.",
        "Mid-morning momentum — keep it going.",
        "Focused mornings build exceptional outcomes." ]
    : h < 14
    ? [ "Midday check-in: are you on track?",
        "Refuel. Refocus. Finish strong.",
        "Half the day remains. More than enough." ]
    : h < 17
    ? [ "Afternoons are for execution. Ship something.",
        "The grind is just discipline in disguise.",
        "Progress over perfection — always." ]
    : h < 20
    ? [ "Evenings are for reflection and preparation.",
        "What did you do today that future you will thank you for?",
        "Wind down, but don't coast." ]
    : [ "Late nights belong to the dedicated.",
        "While others sleep, the focused prepare.",
        "End the day intentionally. You earned it." ];

  const caption = captions[Math.floor(Math.random() * captions.length)];
  const el = document.getElementById("splash-caption");
  if (el) el.textContent = caption;
})();

import { onAuthStateChanged, logOut, signUp, logIn, resetPassword, logInWithGoogle } from "./auth.js";
import { getUserProfile, updateUserProfile } from "./db.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderSubjects } from "./pages/subjects.js";
import { renderTopics } from "./pages/topics.js";
import { renderTasks } from "./pages/tasks.js";
import { renderAnalytics } from "./pages/analytics.js";
import { renderSettings } from "./pages/settings.js";
import { showInAppNotification, onForegroundMessage } from "./notifications.js";
import { showSnackbar } from "./snackbar.js";

// ── Global State ──────────────────────────────────────────────────────────────
export const state = {
  user: null,
  profile: null,
  currentPage: "dashboard",
  selectedSubjectId: null,     // for topic drill-down
  selectedSubjectName: null,
};

// ── DOM helpers ───────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

function showEl(...ids) { ids.forEach((id) => $( id)?.classList.remove("hidden")); }
function hideEl(...ids) { ids.forEach((id) => $(id)?.classList.add("hidden")); }

// ── Show Landing / Auth / App shells ──────────────────────────────────────────
function showLanding() {
  hideEl("page-auth","page-app");
  showEl("page-landing");
  // Trigger entrance animation
  const landing = document.getElementById("page-landing");
  landing?.classList.remove("landing-animate-in");
  void landing?.offsetWidth; // reflow
  landing?.classList.add("landing-animate-in");
}
function showAuthPage() { hideEl("page-landing","page-app"); showEl("page-auth"); }
function showAppPage()  { hideEl("page-landing","page-auth"); showEl("page-app"); }

// ── Apply saved theme ─────────────────────────────────────────────────────────
export function applyTheme(theme = "dark") {
  document.documentElement.setAttribute("data-theme", theme);
}

// ── Ripple Effect logic ───────────────────────────────────────────────────────
function initRipples() {
  document.querySelectorAll(".ripple").forEach(btn => {
    // avoid multiple listeners
    if (btn.dataset.rippleInit) return;
    btn.dataset.rippleInit = "true";

    btn.addEventListener("click", function(e) {
      const rect = this.getBoundingClientRect();
      const radius = Math.max(rect.width, rect.height);
      const circle = document.createElement("span");
      
      const diameter = radius * 2;
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.classList.add("ripple-pulse");
      
      this.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  });
}

// ── Navigate between app pages ────────────────────────────────────────────────
export async function navigate(page, params = {}) {
  state.currentPage = page;
  if (params.subjectId) state.selectedSubjectId = params.subjectId;
  if (params.subjectName) state.selectedSubjectName = params.subjectName;

  // Update drawer active state
  document.querySelectorAll(".drawer-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  const content = $("main-content");
  if (!content) return;
  content.innerHTML = ""; // clear

  const uid = state.user?.uid;
  const profile = state.profile;

  // Add subtle page transition
  content.classList.remove("fadeSlideUp");
  // force reflow
  void content.offsetWidth;
  content.classList.add("fadeSlideUp");

  switch (page) {
    case "dashboard":  await renderDashboard(content, uid, profile); break;
    case "schedule":
      const { renderSchedule } = await import("./pages/schedule.js");
      await renderSchedule(content, uid, profile);
      break;
    case "subjects":   await renderSubjects(content, uid, profile); break;
    case "topics":     await renderTopics(content, uid, params.subjectId || state.selectedSubjectId, params.subjectName || state.selectedSubjectName); break;
    case "tasks":      await renderTasks(content, uid, profile); break;
    case "analytics":  await renderAnalytics(content, uid, profile); break;
    case "settings":   await renderSettings(content, uid, profile, state); break;


    case "scheduler":   
      const { renderSchedulerTab } = await import("./pages/scheduler.js");
      await renderSchedulerTab(content, uid, profile); 
      break;
    case "personalDevelopment":
      const { renderPersonalDevelopment } = await import("./pages/personalDevelopment.js");
      await renderPersonalDevelopment(content, uid, profile);
      break;
  }

  // Bind ripples to newly rendered content
  initRipples();

  // Initialize Lucide icons for new content
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ── Auth flows ────────────────────────────────────────────────────────────────
function initAuthForms() {
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
      await handleUserAuth(user);
    } catch (err) {
      errEl.textContent = friendlyError(err.code);
      errEl.classList.remove("hidden");
      btn.textContent = "Sign In";
      btn.disabled = false;
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
      await handleUserAuth(user);
    } catch (err) {
      errEl.textContent = friendlyError(err.code);
      errEl.classList.remove("hidden");
      btn.textContent = "Create Account";
      btn.disabled = false;
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
      msgEl.style.color = "var(--error)";
      msgEl.textContent = friendlyError(err.code);
      msgEl.classList.remove("hidden");
    }
  });

  // ── Google Sign In ────────────────────────────────────────
  const handleGoogleAuth = async () => {
    try {
      const user = await logInWithGoogle();
      await handleUserAuth(user);
    } catch (err) {
      console.error("Google Auth Error:", err);
      // For now just alert or log; app.js logic handles onAuthStateChanged
    }
  };

  $("btn-google-login")?.addEventListener("click", handleGoogleAuth);
  $("btn-google-signup")?.addEventListener("click", handleGoogleAuth);

  // ── Navigation between auth screens ──────────────────────
  const show = (id) => {
    ["auth-login","auth-signup","auth-forgot"].forEach((x) =>
      document.getElementById(x)?.classList.toggle("hidden", x !== id)
    );
  };
  $("link-to-signup")?.addEventListener("click", (e) => { e.preventDefault(); show("auth-signup"); });
  $("link-to-login")?.addEventListener("click",  (e) => { e.preventDefault(); show("auth-login"); });
  $("link-forgot-pw")?.addEventListener("click", (e) => { e.preventDefault(); show("auth-forgot"); });
  $("link-back-to-login")?.addEventListener("click", (e) => { e.preventDefault(); show("auth-login"); });

  // ── Close auth — animate out in reverse ──────────────────
  document.querySelectorAll(".auth-close-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Find the visible auth page and animate it out
      const visibleAuth = ["auth-login","auth-signup","auth-forgot"]
        .map(id => document.getElementById(id))
        .find(el => el && !el.classList.contains("hidden"));

      if (visibleAuth) {
        visibleAuth.classList.add("auth-slide-out");
        setTimeout(() => {
          visibleAuth.classList.remove("auth-slide-out");
          showLanding();
          // Add a re-enter animation on the landing page
          const landing = document.getElementById("page-landing");
          landing?.classList.remove("page-enter");
          void landing?.offsetWidth;
          landing?.classList.add("page-enter");
        }, 280);
      } else {
        showLanding();
      }
    });
  });
}

function initLanding() {
  function animateCtaThenGo(btnId, authView) {
    const btn = $(btnId);
    const landing = $("page-landing");
    if (!btn) return;
    btn.addEventListener("click", () => {
      // Button press animation
      btn.classList.add("btn-cta-pressed");
      // Page exit
      landing?.classList.add("page-exit");
      setTimeout(() => {
        btn.classList.remove("btn-cta-pressed");
        landing?.classList.remove("page-exit");
        showAuthPage();
        // Slide in target auth card
        ["auth-login","auth-signup","auth-forgot"].forEach(x => {
          const el = document.getElementById(x);
          if (!el) return;
          el.classList.toggle("hidden", x !== authView);
          if (x === authView) {
            el.classList.remove("auth-slide-in");
            void el.offsetWidth;
            el.classList.add("auth-slide-in");
          }
        });
      }, 320);
    });
  }
  animateCtaThenGo("btn-get-started", "auth-signup");
  animateCtaThenGo("btn-landing-login", "auth-login");
}

// ── Side Drawer Navigation ───────────────────────────────────────────────────
function initNavigation() {
  const drawer = document.getElementById("side-drawer");
  const overlay = document.getElementById("drawer-overlay");
  const toggleBtn = document.getElementById("btn-menu-toggle");
  const closeBtn = document.getElementById("btn-close-drawer");

  function openDrawer() {
    drawer?.classList.add("open");
    overlay?.classList.add("active");
  }

  function closeDrawer() {
    drawer?.classList.remove("open");
    overlay?.classList.remove("active");
  }

  toggleBtn?.addEventListener("click", openDrawer);
  closeBtn?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", closeDrawer);

  document.querySelectorAll(".drawer-item[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigate(btn.dataset.page);
      closeDrawer();
    });
  });
}

// ── FAB quick-add task ────────────────────────────────────────────────────────
function initFab() {
  $("fab-add-task")?.addEventListener("click", async () => {
    const { openTaskModal } = await import("./pages/tasks.js");
    openTaskModal(state.user.uid, state.profile, () => {
      if (state.currentPage === "tasks" || state.currentPage === "dashboard") {
        navigate(state.currentPage);
      }
    });
  });
}

// ── Install prompt (iOS Safari) ───────────────────────────────────────────────
function initInstallPrompt() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;

  if (isIOS && !isStandalone) {
    const dismissed = localStorage.getItem("sf_install_dismissed");
    if (!dismissed) {
      setTimeout(() => {
        const prompt = $("install-prompt");
        if (prompt) prompt.classList.remove("hidden");
      }, 30000); // show after 30s of engagement
    }
  }

  $("install-prompt-close")?.addEventListener("click", () => {
    $("install-prompt")?.classList.add("hidden");
    localStorage.setItem("sf_install_dismissed", "1");
  });

  // Standard beforeinstallprompt for Android / desktop
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    const prompt = $("install-prompt");
    if (prompt) {
      prompt.querySelector(".install-prompt-desc").textContent = "Install Your Day for the best experience";
      prompt.classList.remove("hidden");
      prompt.addEventListener("click", () => e.prompt(), { once: true });
    }
  });
}

// ── Foreground push message handler ───────────────────────────────────────────
function initForegroundMessages() {
  try {
    onForegroundMessage((payload) => {
      const title = payload.notification?.title || "Your Day";
      const body  = payload.notification?.body  || "You have a reminder.";
      showInAppNotification(title, body);
    });
  } catch (_) {}
}

// ── Error messages ────────────────────────────────────────────────────────────
function friendlyError(code) {
  const map = {
    "auth/user-not-found":      "No account found with that email.",
    "auth/wrong-password":      "Incorrect password. Try again.",
    "auth/email-already-in-use":"That email is already registered.",
    "auth/invalid-email":       "Please enter a valid email address.",
    "auth/weak-password":       "Password must be at least 6 characters.",
    "auth/too-many-requests":   "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return map[code] || `Error: ${code}`;
}

async function handleUserAuth(user) {
  state.user = user;

  // Load profile
  const profile = await getUserProfile(user.uid);
  state.profile = profile;

  // Apply saved theme
  applyTheme(profile?.theme || "dark");

  // Show app
  showAppPage();
  initNavigation();
  initFab();
  initForegroundMessages();

  // Check for action shortcut in URL
  const params = new URLSearchParams(window.location.search);
  if (params.get("action") === "add-task") {
    const { openTaskModal } = await import("./pages/tasks.js");
    openTaskModal(user.uid, profile, () => navigate("tasks"));
  }

  await navigate("dashboard");
}

// ── Entry point ───────────────────────────────────────────────────────────────
function main() {
  initLanding();
  initAuthForms();
  initInstallPrompt();

  onAuthStateChanged(async (user) => {
    if (user) {
      await handleUserAuth(user);
    } else {
      state.user = null;
      state.profile = null;
      showLanding();
    }
    hideSplash();
  });
}

function hideSplash() {
  const splash = $("app-splash");
  if (splash) {
    splash.classList.add("splash-hide");
    setTimeout(() => splash.remove(), 600);
  }
}

main();
