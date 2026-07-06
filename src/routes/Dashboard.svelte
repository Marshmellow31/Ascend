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
  import StatCard from '../components/ui/StatCard.svelte';
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
  const dateLine = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).replace(',', ' ·').toUpperCase();

  const a = $derived(data?.analytics);
  const pending = $derived(data?.pending || []);
  const notes = $derived(data?.notes || []);
  const focusStats = $derived(data?.focusStats);
  const focusLabel = $derived.by(() => {
    const m = focusStats?.focusMinutes || 0;
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}` : `${m}`;
  });
  const focusUnit = $derived((focusStats?.focusMinutes || 0) >= 60 ? 'm' : 'min');
</script>

<section class="fade-up">
  <header class="greet">
    <div>
      <div class="eyebrow">{dateLine}</div>
      <h1 class="g-name">{greetText}{greetSep}<br>{profile?.displayName?.split(' ')[0] || 'Student'}.</h1>
    </div>
    <button class="startfocus" onclick={() => navigate('focus')}>
      <Icon name="play" size={16} stroke={3} /> START FOCUS
    </button>
  </header>

  {#if loading}
    <Skeleton height="240px" />
    <div class="hero-grid" style="margin-top:14px"><Skeleton height="110px" /><Skeleton height="110px" /></div>
  {:else}
    <div class="hero-grid">
      <div class="goal-cell"><DailyGoalRing completed={a?.todayCompleted || 0} target={g.dailyGoalTarget} /></div>
      <StatCard icon="flame" label="Streak" value={a?.streak || 0} unit="days" iconColor="var(--accent)" delta={a?.streak ? 'Keep it up!' : 'Complete a task to start'} />
      <StatCard icon="timer" label="Focus time" value={focusLabel} unit={focusUnit} iconColor="var(--hue-violet)" animate={false} delta="{focusStats?.focusSessions || 0} sessions" />
      <StatCard icon="zap" label="Completion" value={a?.completionRate || 0} suffix="%" iconColor="var(--hue-amber)" delta="all time" />
      <StatCard icon="check-check" label="Completed" value={a?.completed || 0} unit="this wk" iconColor="var(--hue-green)" delta="{pending.length} pending" />
    </div>

    <!-- Today's tasks -->
    <div class="section-head">
      <h2>Up next</h2>
      <button class="alllink" onclick={() => navigate('tasks')}>All tasks <Icon name="chevron-right" size={15} /></button>
    </div>
    {#if pending.length}
      <div class="stack">
        {#each pending.slice(0, 5) as task (task.id)}
          <TaskCard {task} oncomplete={complete} onopen={() => navigate('tasks')} />
        {/each}
      </div>
    {:else}
      <div class="empty"><div class="empty-icon"><Icon name="circle-check" size={22} /></div>You're all caught up. Nice.</div>
    {/if}

    <!-- Quick notes -->
    <div class="section-head"><h2>Quick notes</h2><button class="alllink" onclick={newNote}><Icon name="plus" size={14} /> New</button></div>
    {#if notes.length}
      <div class="notes-grid">
        {#each notes.slice(0, 4) as note (note.id)}<NoteCard {note} onopen={openNote} />{/each}
      </div>
    {:else}
      <button class="empty-block" onclick={newNote}><Icon name="sticky-note" size={18} /> Jot a quick note</button>
    {/if}
  {/if}
</section>

<NoteModal open={noteOpen} note={editingNote} {uid} onclose={() => (noteOpen = false)} onsaved={load} />

<style>
  .greet { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding: 10px 0 28px; }
  .greet .eyebrow { margin-bottom: 6px; }
  .g-name { font-size: var(--fs-display); font-weight: 900; letter-spacing: -1.5px; line-height: 1; }
  .startfocus {
    display: flex; align-items: center; gap: 10px; padding: 14px 24px; border-radius: var(--r-full);
    background: var(--accent); color: var(--text-on-accent);
    font-size: 15px; font-weight: 900; letter-spacing: 0.3px;
    box-shadow: 0 8px 32px var(--accent-shadow); transition: transform var(--t-fast);
  }
  .startfocus:hover { transform: scale(1.04); }
  .startfocus:active { transform: scale(0.97); }

  .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .goal-cell { grid-column: span 2; }
  .goal-cell :global(.dgr) { height: 100%; }

  .alllink { display: flex; align-items: center; gap: 4px; color: var(--text-2); font-size: 13px; font-weight: 700; transition: color var(--t-fast); }
  .alllink:hover { color: var(--text); }

  .empty-block {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 20px;
    border-radius: var(--r-md); color: var(--text-3); border: 1px dashed var(--border-strong);
    background: transparent; font-size: var(--fs-sm); font-weight: 700;
  }
  .notes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  @media (min-width: 1024px) {
    .hero-grid { grid-template-columns: 1.4fr 1fr 1fr; }
    .goal-cell { grid-column: 1; grid-row: span 2; }
    .notes-grid { grid-template-columns: repeat(4, 1fr); }
  }
</style>
