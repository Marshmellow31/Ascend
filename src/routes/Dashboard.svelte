<script>
  import { onMount } from 'svelte';
  import { authStore } from '../lib/stores/auth.svelte.js';
  import { gamification as g } from '../lib/stores/gamification.svelte.js';
  import { navigate } from '../lib/router.svelte.js';
  import { getSubjects, getTasks, getNotes, getFocusSessions } from '../lib/db.js';
  import { computeAnalyticsFrom, computeFocusStats } from '../lib/logic/analytics.js';
  import { completeTaskWithRewards, syncProgress } from '../lib/rewards.js';
  import { cache } from '../lib/utils/swrCache.js';
  import { parseFbDate } from '../lib/utils/dates.js';

  import DailyGoalRing from '../components/gamification/DailyGoalRing.svelte';
  import TaskCard from '../components/cards/TaskCard.svelte';
  import NoteCard from '../components/cards/NoteCard.svelte';
  import NoteModal from '../components/cards/NoteModal.svelte';
  import Skeleton from '../components/ui/Skeleton.svelte';
  import Icon from '../components/ui/Icon.svelte';

  const uid = authStore.uid;
  const profile = $derived(authStore.profile);

  let data = $state(cache.get(`dashboard_${uid}`));
  let loading = $state(!data);
  let noteOpen = $state(false);
  let editingNote = $state(null);

  const PRIORITY = { high: 3, medium: 2, low: 1 };
  function sortPending(tasks) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return [...tasks].sort((a, b) => {
      const ad = parseFbDate(a.dueDate); const bd = parseFbDate(b.dueDate);
      if (ad) ad.setHours(0, 0, 0, 0); if (bd) bd.setHours(0, 0, 0, 0);
      const at = ad && ad <= now; const bt = bd && bd <= now;
      if (at && !bt) return -1; if (!at && bt) return 1;
      const ap = PRIORITY[(a.priority || 'medium')] || 2; const bp = PRIORITY[(b.priority || 'medium')] || 2;
      if (ap !== bp) return bp - ap;
      if (ad && !bd) return -1; if (!ad && bd) return 1;
      if (ad && bd) return ad - bd;
      return 0;
    });
  }

  async function load() {
    if (!uid) return;
    const [subjects, allTasks, notes, sessions] = await Promise.all([
      getSubjects(uid), getTasks(uid), getNotes(uid), getFocusSessions(uid),
    ]);
    const analytics = computeAnalyticsFrom(allTasks, profile?.weekStartDay || 'monday', subjects);
    const focusStats = computeFocusStats(sessions);
    data = { analytics, pending: sortPending(allTasks.filter((t) => !t.isCompleted)), notes, focusStats };
    cache.set(`dashboard_${uid}`, data);
    loading = false;
    syncProgress(analytics, focusStats);
  }

  onMount(() => {
    load();
    const onChange = () => load();
    window.addEventListener('data-changed', onChange);
    return () => window.removeEventListener('data-changed', onChange);
  });

  async function complete(task) { await completeTaskWithRewards(task); await load(); }
  function openNote(n) { editingNote = n; noteOpen = true; }
  function newNote() { editingNote = null; noteOpen = true; }

  function greeting() {
    const h = new Date().getHours();
    if (h < 5) return 'Still up?'; if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon'; if (h < 22) return 'Good evening'; return 'Winding down?';
  }
  const greetText = greeting();
  const greetSep = greetText.endsWith('?') ? '' : ',';

  const a = $derived(data?.analytics);
  const pending = $derived(data?.pending || []);
  const notes = $derived(data?.notes || []);

  const btech = $derived.by(() => {
    const p = profile;
    if (!p?.btechStart || !p?.btechEnd) return null;
    const start = new Date(p.btechStart + 'T00:00:00');
    const end = new Date(p.btechEnd + 'T00:00:00');
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const total = Math.round((end - start) / 864e5);
    const elapsed = Math.min(Math.max(Math.round((now - start) / 864e5), 0), total);
    return { name: p.btechName || 'Long-term focus', pct: total ? Math.round((elapsed / total) * 100) : 0, monthsLeft: Math.round((total - elapsed) / 30.44) };
  });
</script>

<header class="greet">
  <div class="g-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
  <h1 class="g-name">{profile?.displayName || 'Student'}</h1>
</header>

{#if loading}
  <Skeleton height="160px" />
  <div class="grid2"><Skeleton height="80px" /><Skeleton height="80px" /></div>
{:else}
  <!-- Hero Daily Progress -->
  <div style="margin-bottom: 12px;">
    <DailyGoalRing completed={a?.todayCompleted || 0} target={g.dailyGoalTarget} />
  </div>

  <div class="grid2">
    <!-- Streak Card -->
    <button class="action-card glass" onclick={() => navigate('analytics')}>
      <div class="ac-ic streak"><Icon name="flame" size={20} /></div>
      <div class="ac-text">
        <span class="ac-title">{a?.streak || 0} Day Streak</span>
        <span class="ac-sub text-xs muted">Keep it up!</span>
      </div>
    </button>

    <!-- Focus Card -->
    <button class="action-card glass" onclick={() => navigate('focus')}>
      <div class="ac-ic focus"><Icon name="timer" size={20} /></div>
      <div class="ac-text">
        <span class="ac-title">Focus</span>
        <span class="ac-sub text-xs muted">Start session</span>
      </div>
    </button>
  </div>

  {#if btech}
    <button class="btech glass" onclick={() => navigate('settings')}>
      <div class="bt-row"><span class="bt-name">{btech.name}</span><span class="bt-m">{btech.monthsLeft} mo left</span></div>
      <div class="bt-bar"><div class="bt-fill" style="width:{btech.pct}%"></div></div>
    </button>
  {/if}

  <!-- Today's tasks -->
  <div class="section-head"><h2>Today</h2><button class="link" onclick={() => navigate('tasks')}>See all</button></div>
  {#if pending.length}
    <div class="tasks-list glass">
      {#each pending.slice(0, 5) as task (task.id)}
        <TaskCard {task} oncomplete={complete} onopen={() => navigate('tasks')} />
      {/each}
    </div>
  {:else}
    <div class="empty"><div class="empty-icon"><Icon name="circle-check" size={22} /></div>You're all caught up. Nice.</div>
  {/if}

  <!-- Quick notes -->
  <div class="section-head"><h2>Quick notes</h2><button class="link" onclick={newNote}><Icon name="plus" size={14} /> New</button></div>
  {#if notes.length}
    <div class="notes-grid">
      {#each notes.slice(0, 4) as note (note.id)}<NoteCard {note} onopen={openNote} />{/each}
    </div>
  {:else}
    <button class="empty-block glass" onclick={newNote}><Icon name="sticky-note" size={18} /> Jot a quick note</button>
  {/if}
{/if}

<NoteModal open={noteOpen} note={editingNote} {uid} onclose={() => (noteOpen = false)} onsaved={load} />

<style>
  .greet { padding: 10px 2px 24px; }
  .g-name { font-size: 34px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; color: var(--text); margin-top: 4px; }
  .g-date { color: var(--text-3); font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
  
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  
  .action-card { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: var(--r-lg); text-align: left; width: 100%; transition: transform var(--t-fast); }
  .action-card:active { transform: scale(0.96); }
  .ac-ic { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; color: #fff; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
  .ac-ic.streak { background: linear-gradient(135deg, #FF9F0A, #FFD60A); }
  .ac-ic.focus { background: linear-gradient(135deg, var(--accent), var(--accent-2)); }
  .ac-text { display: flex; flex-direction: column; }
  .ac-title { font-weight: 600; font-size: 15px; }
  
  .tasks-list { padding: 4px 16px; }
  
  .btech { display: block; width: 100%; text-align: left; padding: 14px 16px; border-radius: var(--r-lg); margin-top: 12px; }
  .bt-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
  .bt-name { font-weight: 700; font-size: var(--fs-sm); }
  .bt-m { font-size: var(--fs-xs); color: var(--accent); font-weight: 700; }
  .bt-bar { height: 7px; background: var(--glass-border); border-radius: 999px; overflow: hidden; }
  .bt-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-2)); border-radius: 999px; }
  .link { color: var(--accent); font-weight: 600; font-size: var(--fs-sm); }
  .empty-block { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 20px; border-radius: var(--r-md); color: var(--text-3); border: 1px dashed var(--glass-border); background: transparent; font-size: var(--fs-sm); }
  .notes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  
  @media (min-width: 1024px) {
    .grid2 { grid-template-columns: 1fr 1fr 1fr; }
    .notes-grid { grid-template-columns: repeat(4, 1fr); }
  }
</style>
