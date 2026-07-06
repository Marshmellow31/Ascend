<script>
  import { onMount } from 'svelte';
  import { authStore } from '../lib/stores/auth.svelte.js';
  import { getTasks } from '../lib/db.js';
  import { computeAnalyticsFrom } from '../lib/logic/analytics.js';
  import { completeTaskWithRewards, syncProgress } from '../lib/rewards.js';
  import { parseFbDate, toDateKey } from '../lib/utils/dates.js';
  import { cache } from '../lib/utils/swrCache.js';

  import TaskCard from '../components/cards/TaskCard.svelte';
  import Icon from '../components/ui/Icon.svelte';

  const uid = authStore.uid;
  const profile = $derived(authStore.profile);
  const cached = cache.get(`calendar_${uid}`);
  let tasks = $state(cached?.tasks || []);

  const today = new Date();
  let viewY = $state(today.getFullYear());
  let viewM = $state(today.getMonth());
  let selected = $state(toDateKey(today));

  async function load() {
    const t = await getTasks(uid);
    tasks = t;
    cache.set(`calendar_${uid}`, { tasks: t });
  }
  onMount(load);

  const byDate = $derived.by(() => {
    const m = {};
    for (const t of tasks) {
      const d = parseFbDate(t.dueDate);
      if (!d) continue;
      (m[toDateKey(d)] ??= []).push(t);
    }
    return m;
  });

  const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const grid = $derived.by(() => {
    const first = new Date(viewY, viewM, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewY, viewM, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  });

  const monthLabel = $derived(new Date(viewY, viewM, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  function prev() { if (viewM === 0) { viewM = 11; viewY--; } else viewM--; }
  function next() { if (viewM === 11) { viewM = 0; viewY++; } else viewM++; }

  const selectedTasks = $derived(byDate[selected] || []);
  const todayKey = toDateKey(today);

  async function complete(task) {
    await completeTaskWithRewards(task);
    await load();
    syncProgress(computeAnalyticsFrom(tasks, profile?.weekStartDay || 'monday', []));
  }
</script>

<header class="ph fade-up">
  <h1>{monthLabel}</h1>
  <div class="nav">
    <button class="navb" onclick={prev} aria-label="Previous month"><Icon name="chevron-left" size={18} /></button>
    <button class="navb" onclick={next} aria-label="Next month"><Icon name="chevron-right" size={18} /></button>
  </div>
</header>

<div class="cal">
  <div class="wd">{#each WD as d}<span>{d}</span>{/each}</div>
  <div class="days">
    {#each grid as cell, i (i)}
      {#if cell}
        {@const key = toDateKey(cell)}
        {@const count = byDate[key]?.length || 0}
        <button class="day" class:today={key === todayKey} class:sel={key === selected} class:past={key < todayKey} onclick={() => (selected = key)}>
          <span class="dnum">{cell.getDate()}</span>
          <span class="dots">{#if count && key !== todayKey}<span class="dot"></span>{/if}{#if count > 2 && key !== todayKey}<span class="dot d2"></span>{/if}</span>
        </button>
      {:else}<span class="day empty"></span>{/if}
    {/each}
  </div>
</div>

<div class="agenda">
  <div class="section-head"><h2>{new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h2></div>
  {#if selectedTasks.length}
    <div class="stack">
      {#each selectedTasks as task (task.id)}<TaskCard {task} oncomplete={complete} />{/each}
    </div>
  {:else}
    <p class="muted text-sm center" style="padding:24px 0">Nothing due this day.</p>
  {/if}
</div>

<style>
  .ph { display: flex; align-items: center; justify-content: space-between; padding: 8px 0 20px; flex-wrap: wrap; gap: 10px; }
  .nav { display: flex; align-items: center; gap: 8px; }
  .navb {
    width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px;
    background: var(--bg-2); border: 1px solid var(--border-strong); color: var(--text-2);
    transition: color var(--t-fast);
  }
  .navb:hover { color: var(--text); }
  .wd { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 8px; }
  .wd span { text-align: center; font-size: 11px; font-weight: 800; letter-spacing: 1px; color: var(--text-4); text-transform: uppercase; padding: 6px 0; }
  .days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 26px; }
  .day {
    aspect-ratio: 1; border-radius: 14px; background: var(--bg-1); border: 1px solid var(--border);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    color: var(--text); font-size: 14px; font-weight: 800; transition: border-color var(--t-fast);
  }
  .day.empty { background: none; border-color: transparent; }
  .day:not(.empty):hover { border-color: #3A3A44; }
  .day.past { color: var(--text-4); }
  .day.sel { border-color: var(--border-hover); background: var(--bg-active); }
  .day.today { background: var(--accent); border-color: var(--accent); color: var(--text-on-accent); }
  .dnum { line-height: 1; }
  .dots { height: 5px; display: flex; gap: 3px; }
  .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); display: inline-block; }
  .dot.d2 { background: var(--hue-violet); }
  .agenda { margin-top: 8px; }
</style>
