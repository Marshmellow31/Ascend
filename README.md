# Ascend

> **Plan smarter. Grow daily. Level up everything that matters.**

A **frosted-glass, gamified Progressive Web App (PWA)** for students to manage tasks, build
habits, plan their day, focus deeply, and watch their progress climb — earning **XP, levels,
streaks and achievements** along the way. Built with **Svelte 5 + Vite** and **Firebase**,
designed mobile-first with a premium light **and** dark glass aesthetic.

---

## ✨ What's inside

### 🏠 Dashboard
- Live greeting + your **XP / level bar**
- **Daily goal ring** — close it each day for bonus XP and a celebration
- Stat cards (done, completion rate, **streak 🔥**, overdue) with animated counters
- **Focus pipeline** — today's schedule blocks, start a session in one tap
- Today's tasks with one-tap complete (confetti + haptics + sound)
- **Quick notes** with colours + pinning
- Optional **long-term focus** banner (degree, exam prep, etc.)

### 🏆 Gamification
- **XP** for completing tasks (priority-weighted), goal habits, focus sessions and closing your daily ring
- **Levels** with titles (Novice → Legend) and a smooth XP curve
- **Achievements** — streaks, task milestones, focus hours, early bird / night owl, perfect week, and more
- **Celebrations** — confetti, haptics and sound on completions, level-ups and unlocks (all toggleable)
- A dedicated **Profile hub** with your level, streak, lifetime stats and achievement gallery

### ✅ Tasks
- Create, edit, complete and delete with smooth glass cards
- Filter by **status** (pending / today / done / overdue), **priority**, **topic**, and free-text **search**
- Sort by newest, oldest, due date or priority
- Organise into **Topics → Subtopics**

### 📅 Calendar & Focus
- **Calendar** — month view with due-date dots and a per-day task agenda
- **Focus** — a real **Pomodoro timer** (15/25/50 work + breaks) that's timestamp-based
  (survives backgrounding), logs sessions, and feeds XP, streaks and focus stats

### 📊 Analytics
- Weekly summary, **AI-style insights**, a **24-week consistency heatmap**, and topic breakdowns

### ⚡ Power features
- **Command palette** (`Ctrl/⌘ K`) — jump anywhere or create a task instantly
- **Quick capture** sheet from the floating + button
- **Theme customisation** — light/dark, six accent palettes, "reduce transparency", and FX toggles

---

## ⚙️ Tech & architecture

- **Svelte 5 (runes) + Vite** SPA — compiled, tiny runtime, route-level code-splitting
- **Frosted-glass design system** in `src/app.css` — CSS custom properties drive themes,
  accents and a "reduce transparency" fallback; honours `prefers-reduced-motion` and
  `prefers-reduced-transparency`
- **Firebase** (bundled modular SDK) — Auth, Firestore (offline persistence), security rules
- **SWR caching** (`src/lib/utils/swrCache.js`) — instant render from cache, silent revalidate
- **PWA** via `vite-plugin-pwa` (auto-update service worker, offline precache)
- Reusable **pure logic** in `src/lib/logic/` (analytics, goals, daily generator, gamification engine)

```
src/
  main.js · App.svelte · app.css        # entry, shell, design tokens
  RouteOutlet.svelte                    # lazy route loader + transitions
  lib/
    firebase.js  db.js  auth.js  router.svelte.js  nav.js  icons.js  rewards.js
    stores/   auth · theme · gamification · ui · connectivity   (Svelte runes)
    logic/    analytics · goals · dailyGenerator · gamificationEngine
    utils/    swrCache · dates · timeUtils · sanitizer · rateLimiter · logger · feedback
  components/ ui/ · cards/ · nav/ · gamification/
  routes/   Dashboard · Tasks · Calendar · Focus · Analytics · Profile · Settings · Subtopics
  auth/     Auth · Verify
```

> The previous vanilla-JS app under `public/` is **legacy** — it is no longer built or served
> (Vite now builds from the project-root `index.html` + `src/`). It can be removed with
> `git rm -r public` once you're happy with the rewrite.

---

## 🔧 Setup

**Prerequisites:** Node 18+ and a Firebase project (Firestore + Auth enabled).

```bash
npm install
cp .env.example .env     # then fill in your Firebase keys (VITE_FIREBASE_*)
npm run dev              # http://localhost:5173
```

Production:

```bash
npm run build && npm run preview
```

Deploy (Vercel frontend):

```bash
npm run deploy
```

**Deploy Firestore rules — required** so the new `gamification` collection works:

```bash
npm run deploy:rules
```

---

## 🔒 Security

All collections are protected by ownership rules in `firestore.rules`: `tasks`, `subjects`
(topics), `topics` (subtopics), `focusSessions`, `notes`, and `gamification` (one doc per
user). Every document is tagged with the owner's `uid` and is only readable/writable by them.

---

## 📄 License

MIT
