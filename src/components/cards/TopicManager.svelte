<script>
  import Modal from '../ui/Modal.svelte';
  import Button from '../ui/Button.svelte';
  import Icon from '../ui/Icon.svelte';
  import { createSubject, updateSubject, deleteSubject } from '../../lib/db.js';
  import { navigate } from '../../lib/router.svelte.js';
  import { ui, toast } from '../../lib/stores/ui.svelte.js';
  import { cache } from '../../lib/utils/swrCache.js';

  let { open = false, uid, topics = [], onclose = () => {}, onchanged = () => {} } = $props();

  let newName = $state('');
  let busy = $state(false);

  async function add() {
    if (!newName.trim()) return;
    busy = true;
    try { await createSubject(uid, { name: newName.trim(), order: topics.length }); newName = ''; cache.invalidatePrefix('tasks_'); onchanged(); }
    finally { busy = false; }
  }
  async function rename(t) {
    const name = prompt('Rename topic', t.name);
    if (name && name.trim() && name !== t.name) { await updateSubject(t.id, { name: name.trim() }); cache.invalidatePrefix('tasks_'); onchanged(); }
  }
  async function remove(t) {
    const ok = await ui.confirm({ title: 'Delete topic?', message: `“${t.name}” will be removed. Tasks keep their data but lose this topic.`, confirmText: 'Delete', danger: true });
    if (!ok) return;
    await deleteSubject(t.id); cache.invalidatePrefix('tasks_'); onchanged();
  }
  function openSubtopics(t) { onclose(); navigate('subtopics', { topicId: t.id, topicName: t.name }); }
</script>

<Modal {open} {onclose} title="Manage topics" maxWidth="440px">
  <div class="add">
    <input class="input" bind:value={newName} placeholder="New topic name" onkeydown={(e) => e.key === 'Enter' && add()} />
    <Button variant="primary" loading={busy} onclick={add} icon="plus">Add</Button>
  </div>

  {#if topics.length}
    <div class="list">
      {#each topics as t (t.id)}
        <div class="row glass">
          <button class="name" onclick={() => openSubtopics(t)}>
            <span>{t.name}</span><Icon name="chevron-right" size={15} />
          </button>
          <button class="ic" onclick={() => rename(t)} aria-label="Rename"><Icon name="pencil" size={15} /></button>
          <button class="ic danger" onclick={() => remove(t)} aria-label="Delete"><Icon name="trash-2" size={15} /></button>
        </div>
      {/each}
    </div>
  {:else}
    <p class="muted text-sm center" style="padding:20px 0">No topics yet. Add one above.</p>
  {/if}
</Modal>

<style>
  .add { display: flex; gap: 10px; margin-bottom: 16px; }
  .add .input { flex: 1; }
  .list { display: flex; flex-direction: column; gap: 8px; }
  .row { display: flex; align-items: center; gap: 6px; padding: 6px 6px 6px 14px; border-radius: var(--r-md); }
  .name { flex: 1; display: flex; align-items: center; justify-content: space-between; font-weight: 600; font-size: var(--fs-sm); color: var(--text); text-align: left; padding: 8px 0; }
  .name :global(svg) { color: var(--text-3); }
  .ic { width: 34px; height: 34px; display: grid; place-items: center; border-radius: var(--r-sm); color: var(--text-2); }
  .ic:hover { background: var(--glass-bg); color: var(--text); }
  .ic.danger:hover { color: var(--danger); }
</style>
