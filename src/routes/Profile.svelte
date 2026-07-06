<script>
  import { onMount } from 'svelte';
  import { authStore } from '../lib/stores/auth.svelte.js';
  import { gamification as g } from '../lib/stores/gamification.svelte.js';
  import { getSubjects, getFocusSessions, updateUserProfile } from '../lib/db.js';
  import { computeAnalytics, computeFocusStats } from '../lib/logic/analytics.js';
  import { ACHIEVEMENTS } from '../lib/logic/gamificationEngine.js';
  import { logOut } from '../lib/auth.js';
  import { navigate } from '../lib/router.svelte.js';
  import { cache } from '../lib/utils/swrCache.js';

  import AchievementCard from '../components/gamification/AchievementCard.svelte';
  import Icon from '../components/ui/Icon.svelte';
  import Button from '../components/ui/Button.svelte';

  const uid = authStore.uid;
  const profile = $derived(authStore.profile);
  const p = $derived(g.progress);

  const cached = cache.get(`profile_stats_${uid}`);
  let stats = $state(cached || { totalCompleted: 0, streak: 0, focusMinutes: 0 });

  async function load() {
    const subjects = await getSubjects(uid);
    const [a, sessions] = await Promise.all([
      computeAnalytics(uid, profile?.weekStartDay || 'monday', subjects),
      getFocusSessions(uid),
    ]);
    const fs = computeFocusStats(sessions);
    stats = { totalCompleted: a.totalCompleted, streak: a.streak, focusMinutes: fs.focusMinutes };
    cache.set(`profile_stats_${uid}`, stats);
  }
  onMount(load);

  const focusH = $derived((stats.focusMinutes / 60).toFixed(1));
  const unlocked = $derived(g.achievements || {});

  const DPs = [
    'https://api.dicebear.com/7.x/notionists/svg?seed=1&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/notionists/svg?seed=2&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/notionists/svg?seed=3&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=4&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=5&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=6&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=7&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=8&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/bottts/svg?seed=9&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/bottts/svg?seed=10&backgroundColor=c0aede'
  ];

  let selectingDP = $state(false);

  async function setDP(url) {
    if (!uid) return;
    await updateUserProfile(uid, { photoURL: url });
    authStore.setProfile({ ...profile, photoURL: url });
    selectingDP = false;
  }
</script>

<div class="hero fade-up">
  <div class="hero-glow"></div>
  <button class="ring-badge" onclick={() => (selectingDP = !selectingDP)} aria-label="Change Avatar">
    {#if profile?.photoURL || authStore.user?.photoURL}
      <img src={profile?.photoURL || authStore.user?.photoURL} alt="Avatar" class="avatar-img" />
    {:else}
      {(profile?.displayName || 'S')[0].toUpperCase()}
    {/if}
  </button>
  <div class="hero-info">
    <h1 class="hero-name">{profile?.displayName || 'Student'}</h1>
    <div class="hero-meta">Level {g.level} · {g.title}</div>
    <div class="hero-xp">
      <div class="hx-row"><span>LEVEL {g.level}</span><span>{p.into} / {p.span} XP</span></div>
      <div class="hx-track"><div class="hx-fill" style="width:{p.pct}%"></div></div>
    </div>
  </div>
  <div class="hero-stats">
    <div class="hs"><div class="hs-v accent">{stats.streak}</div><div class="hs-l">Day streak</div></div>
    <div class="hs"><div class="hs-v">{stats.totalCompleted}</div><div class="hs-l">Tasks done</div></div>
    <div class="hs"><div class="hs-v">{focusH}h</div><div class="hs-l">Focused</div></div>
  </div>
</div>

{#if selectingDP}
  <div class="dp-selector glass">
    <div class="section-head" style="margin-top: 0;"><h3>Choose Avatar</h3><button class="link" onclick={() => (selectingDP = false)}>Close</button></div>
    <div class="dp-grid">
      {#each DPs as dp}
        <button class="dp-opt" class:active={profile?.photoURL === dp} onclick={() => setDP(dp)}>
          <img src={dp} alt="Avatar option" />
        </button>
      {/each}
      <button class="dp-opt remove" onclick={() => setDP('')}>
        <Icon name="x" size={24} />
      </button>
    </div>
  </div>
{/if}

<div class="goalset glass">
  <div><div class="gs-t">Daily goal</div><div class="text-xs muted">Tasks to close your ring</div></div>
  <div class="stepper">
    <button onclick={() => g.setDailyGoalTarget(g.dailyGoalTarget - 1)} aria-label="Decrease"><Icon name="chevron-left" size={16} /></button>
    <span>{g.dailyGoalTarget}</span>
    <button onclick={() => g.setDailyGoalTarget(g.dailyGoalTarget + 1)} aria-label="Increase"><Icon name="chevron-right" size={16} /></button>
  </div>
</div>

<div class="more">
  <button class="more-link glass" onclick={() => navigate('calendar')}><Icon name="calendar-days" size={18} /><span>Calendar</span><Icon name="chevron-right" size={16} /></button>
  <button class="more-link glass" onclick={() => navigate('analytics')}><Icon name="pie-chart" size={18} /><span>Analytics</span><Icon name="chevron-right" size={16} /></button>
  <button class="more-link glass" onclick={() => navigate('settings')}><Icon name="settings" size={18} /><span>Settings</span><Icon name="chevron-right" size={16} /></button>
</div>

<div class="section-head"><h2>Achievements</h2><span class="text-xs muted">{Object.keys(unlocked).length} unlocked</span></div>
<div class="badges">
  {#each ACHIEVEMENTS as ach (ach.id)}
    <AchievementCard achievement={ach} unlockedAt={unlocked[ach.id] || null} />
  {/each}
</div>

<Button variant="danger" full icon="log-out" onclick={() => logOut()} class="signout">Sign out</Button>

<style>
  .hero {
    position: relative; overflow: hidden;
    display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
    padding: 32px; border-radius: var(--r-hero); margin-bottom: 14px;
    background: var(--grad-hero); border: 1px solid var(--track);
  }
  .hero-glow {
    position: absolute; top: -80px; left: 30%; width: 260px; height: 260px; border-radius: 50%;
    background: var(--accent-glow); filter: blur(80px); pointer-events: none;
  }
  .ring-badge {
    width: 88px; height: 88px; flex-shrink: 0; display: grid; place-items: center; position: relative;
    border-radius: 50%; font-size: 34px; font-weight: 900; color: var(--text-on-accent);
    background: var(--accent); border: none; padding: 0; cursor: pointer; transition: transform var(--t-fast);
  }
  .hero-info { flex: 1; min-width: 200px; position: relative; }
  .hero-name { margin: 0 0 4px; font-size: 32px; font-weight: 900; letter-spacing: -1px; }
  .hero-meta { font-size: 13.5px; color: var(--text-2); font-weight: 600; margin-bottom: 14px; }
  .hero-xp { max-width: 340px; }
  .hx-row { display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 800; color: var(--text-2); margin-bottom: 6px; letter-spacing: 0.5px; }
  .hx-track { height: 9px; border-radius: 99px; background: var(--track); overflow: hidden; }
  .hx-fill { height: 100%; border-radius: 99px; background: var(--accent); transition: width 0.6s var(--ease); }
  .hero-stats { display: flex; gap: 26px; position: relative; }
  .hs { text-align: center; }
  .hs-v { font-size: 28px; font-weight: 900; }
  .hs-v.accent { color: var(--accent); }
  .hs-l { font-size: 10.5px; font-weight: 800; letter-spacing: 0.8px; color: var(--text-2); text-transform: uppercase; }
  .goalset { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: var(--r-lg); margin-bottom: 6px; }
  .gs-t { font-weight: 700; }
  .stepper { display: flex; align-items: center; gap: 6px; }
  .stepper button { width: 34px; height: 34px; display: grid; place-items: center; border-radius: var(--r-full); background: var(--glass-bg); color: var(--text-2); }
  .stepper span { min-width: 28px; text-align: center; font-weight: 800; font-size: 18px; }
  .more { display: grid; gap: 8px; margin: 4px 0 6px; }
  .more-link { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-radius: var(--r-md); text-align: left; font-weight: 600; font-size: var(--fs-sm); }
  .more-link > span { flex: 1; }
  .more-link :global(svg:last-child) { color: var(--text-3); }
  .badges { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; }
  :global(.signout) { margin-top: 18px; }
  .avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--r-full); }
  .ring-badge:active { transform: scale(0.95); }
  .dp-selector { padding: 16px; border-radius: var(--r-lg); margin-bottom: 12px; }
  .dp-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
  .dp-opt { width: 50px; height: 50px; border-radius: var(--r-full); overflow: hidden; border: 2px solid transparent; background: var(--fill-secondary); transition: transform var(--t-fast); cursor: pointer; padding: 0; }
  .dp-opt img { width: 100%; height: 100%; object-fit: cover; }
  .dp-opt:active { transform: scale(0.9); }
  .dp-opt.active { border-color: var(--accent); }
  .dp-opt.remove { display: grid; place-items: center; color: var(--text-2); }
</style>
