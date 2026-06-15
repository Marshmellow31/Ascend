<script>
  import { onMount } from 'svelte';
  import { authStore } from '../lib/stores/auth.svelte.js';
  import { getTopics, createTopic, updateTopic, deleteTopic } from '../lib/db.js';
  import { navigate } from '../lib/router.svelte.js';
  import { ui } from '../lib/stores/ui.svelte.js';
  import Button from '../components/ui/Button.svelte';
  import Icon from '../components/ui/Icon.svelte';
  import EmptyState from '../components/ui/EmptyState.svelte';

  let { params = {} } = $props();
  const uid = authStore.uid;
  const subjectId = $derived(params.topicId);
  const topicName = $derived(params.topicName || 'Topic');

  let items = $state([]);
  let newName = $state('');
  let busy = $state(false);

  async function load() { if (subjectId) items = await getTopics(uid, subjectId); }
  onMount(load);
  $effect(() => { subjectId; load(); });

  async function add() {
    if (!newName.trim()) return;
    busy = true;
    try { await createTopic(uid, { subjectId, name: newName.trim(), order: items.length }); newName = ''; await load(); }
    finally { busy = false; }
  }
  async function rename(it) {
    const name = prompt('Rename subtopic', it.name);
    if (name?.trim() && name !== it.name) { await updateTopic(it.id, { name: name.trim() }); load(); }
  }
  async function remove(it) {
    const ok = await ui.confirm({ title: 'Delete subtopic?', message: `“${it.name}” will be removed.`, confirmText: 'Delete', danger: true });
    if (ok) { await deleteTopic(it.id); load(); }
  }
</script>

<header class="ph">
  <button class="back" onclick={() => navigate('tasks')} aria-label="Back"><Icon name="arrow-left" size={18} /></button>
  <div><div class="text-xs muted">Subtopics of</div><h1>{topicName}</h1></div>
</header>

<div class="add">
  <input class="input" bind:value={newName} placeholder="New subtopic" onkeydown={(e) => e.key === 'Enter' && add()} />
  <Button variant="primary" loading={busy} onclick={add} icon="plus">Add</Button>
</div>

{#if items.length}
  <div class="stack">
    {#each items as it (it.id)}
      <div class="row glass">
        <span class="name">{it.name}</span>
        <button class="ic" onclick={() => rename(it)} aria-label="Rename"><Icon name="pencil" size={15} /></button>
        <button class="ic danger" onclick={() => remove(it)} aria-label="Delete"><Icon name="trash-2" size={15} /></button>
      </div>
    {/each}
  </div>
{:else}
  <EmptyState icon="folder" title="No subtopics yet" subtitle="Break this topic into smaller parts." />
{/if}

<style>
  .ph { display: flex; align-items: center; gap: 12px; padding: 8px 2px 18px; }
  .back { width: 38px; height: 38px; display: grid; place-items: center; border-radius: var(--r-full); color: var(--text-2); background: var(--glass-bg); }
  .ph h1 { font-size: 24px; }
  .add { display: flex; gap: 10px; margin-bottom: 16px; }
  .add .input { flex: 1; }
  .row { display: flex; align-items: center; gap: 6px; padding: 8px 8px 8px 16px; border-radius: var(--r-md); }
  .name { flex: 1; font-weight: 600; font-size: var(--fs-sm); }
  .ic { width: 34px; height: 34px; display: grid; place-items: center; border-radius: var(--r-sm); color: var(--text-2); }
  .ic.danger:hover { color: var(--danger); }
</style>
