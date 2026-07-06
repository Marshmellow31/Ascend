<script>
  import { onMount } from 'svelte';
  import { authStore } from '../lib/stores/auth.svelte.js';
  import { getTasks, getSubjects } from '../lib/db.js';
  import { computeAnalyticsFrom } from '../lib/logic/analytics.js';
  import { completeTaskWithRewards, syncProgress } from '../lib/rewards.js';
  import { cache } from '../lib/utils/swrCache.js';
  import { parseFbDate } from '../lib/utils/dates.js';

  import TaskCard from '../components/cards/TaskCard.svelte';
  import TaskEditorModal from '../components/cards/TaskEditorModal.svelte';
  import TopicManager from '../components/cards/TopicManager.svelte';
  import SegmentedControl from '../components/ui/SegmentedControl.svelte';
  import Button from '../components/ui/Button.svelte';
  import Icon from '../components/ui/Icon.svelte';
  import Skeleton from '../components/ui/Skeleton.svelte';
  import EmptyState from '../components/ui/EmptyState.svelte';

  const uid = authStore.uid;
  const profile = $derived(authStore.profile);

  const cached = cache.get(`tasks_${uid}`);
  let allTasks = $state(cached?.tasks || []);
  let topics = $state(cached?.topics || []);
  let loading = $state(!cached);

  let status = $state('pending');
  let priority = $state('all');
  let topic = $state('all');
  let sort = $state('newest');
  let search = $state('');

  let editorOpen = $state(false);
  let editing = $state(null);
  let mgrOpen = $state(false);

  async function load() {
    const [tasks, subs] = await Promise.all([getTasks(uid), getSubjects(uid)]);
    allTasks = tasks; topics = subs; loading = false;
    cache.set(`tasks_${uid}`, { tasks, topics: subs });
  }
  onMount(() => {
    load();
    const onChange = () => load();
    window.addEventListener('data-changed', onChange);
    return () => window.removeEventListener('data-changed', onChange);
  });

  const PRIO = { high: 3, medium: 2, low: 1 };
  const filtered = $derived.by(() => {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
    let list = allTasks.filter((t) => {
      if (status === 'pending' && t.isCompleted) return false;
      if (status === 'completed' && !t.isCompleted) return false;
      const due = parseFbDate(t.dueDate);
      if (status === 'today') { if (t.isCompleted || !due || due < todayStart || due >= todayEnd) return false; }
      if (status === 'overdue') { if (t.isCompleted || !due || due >= now) return false; }
      if (priority !== 'all' && (t.priority || 'medium') !== priority) return false;
      if (topic !== 'all' && t.subjectId !== topic) return false;
      if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sort === 'priority') return (PRIO[b.priority] || 2) - (PRIO[a.priority] || 2);
      if (sort === 'due') { const ad = parseFbDate(a.dueDate)?.getTime() ?? Infinity; const bd = parseFbDate(b.dueDate)?.getTime() ?? Infinity; return ad - bd; }
      const at = a.createdAt?.toMillis?.() || 0; const bt = b.createdAt?.toMillis?.() || 0;
      return sort === 'oldest' ? at - bt : bt - at;
    });
    return list;
  });

  async function complete(task) {
    await completeTaskWithRewards(task);
    await load();
    const analytics = computeAnalyticsFrom(allTasks, profile?.weekStartDay || 'monday', topics);
    syncProgress(analytics);
  }
  function openNew() { editing = null; editorOpen = true; }
  function openEdit(t) { editing = t; editorOpen = true; }
</script>

<header class="ph fade-up">
  <h1>Tasks</h1>
  <Button variant="primary" size="sm" icon="plus" onclick={openNew}>NEW TASK</Button>
</header>

<div class="search">
  <Icon name="search" size={17} />
  <input bind:value={search} placeholder="Search tasks…" aria-label="Search tasks" />
</div>

<SegmentedControl
  options={[{ value: 'pending', label: 'Pending' }, { value: 'today', label: 'Today' }, { value: 'completed', label: 'Done' }, { value: 'overdue', label: 'Overdue' }]}
  value={status} onchange={(v) => (status = v)} size="sm"
/>

<div class="filters">
  <select class="select" bind:value={priority}><option value="all">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
  <select class="select" bind:value={topic}><option value="all">All topics</option>{#each topics as t (t.id)}<option value={t.id}>{t.name}</option>{/each}</select>
  <select class="select" bind:value={sort}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="due">Due date</option><option value="priority">Priority</option></select>
  <button class="manage" onclick={() => (mgrOpen = true)} title="Manage topics"><Icon name="tag" size={16} /></button>
</div>

{#if loading}
  <div class="stack">{#each Array(4) as _}<Skeleton height="62px" />{/each}</div>
{:else if filtered.length}
  <div class="count text-xs muted">{filtered.length} task{filtered.length === 1 ? '' : 's'}</div>
  <div class="stack">
    {#each filtered as task (task.id)}
      <TaskCard {task} oncomplete={complete} onopen={openEdit} />
    {/each}
  </div>
{:else}
  <EmptyState icon="check-square" title="Nothing here" subtitle="No tasks match these filters.">
    <Button variant="primary" icon="plus" onclick={openNew}>Add a task</Button>
  </EmptyState>
{/if}

<TaskEditorModal open={editorOpen} task={editing} {uid} {topics} onclose={() => (editorOpen = false)} onsaved={load} />
<TopicManager open={mgrOpen} {uid} {topics} onclose={() => (mgrOpen = false)} onchanged={load} />

<style>
  .ph { display: flex; align-items: center; justify-content: space-between; padding: 8px 0 20px; }
  .search {
    display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: var(--r-full);
    margin-bottom: 16px; background: var(--bg-2); border: 1px solid var(--border-raised); color: var(--text-2);
    transition: border-color var(--t-fast);
  }
  .search:focus-within { border-color: var(--border-hover); }
  .search input { flex: 1; background: none; border: none; outline: none; color: var(--text); font-weight: 600; }
  .filters { display: flex; gap: 8px; margin: 16px 0; overflow-x: auto; padding-bottom: 4px; }
  .filters::-webkit-scrollbar { display: none; }
  .filters .select { width: auto; padding: 9px 32px 9px 15px; font-size: 13px; font-weight: 700; border-radius: var(--r-full); background-color: var(--bg-2); border: 1px solid var(--border-strong); color: var(--text-nav); outline: none; }
  .manage { flex-shrink: 0; width: 36px; height: 36px; border-radius: var(--r-full); background: var(--bg-2); border: 1px solid var(--border-strong); color: var(--text-nav); display: grid; place-items: center; }
  .count { margin-bottom: 8px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; font-size: 11px; }
</style>
