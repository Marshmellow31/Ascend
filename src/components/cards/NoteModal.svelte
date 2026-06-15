<script>
  import Modal from '../ui/Modal.svelte';
  import Button from '../ui/Button.svelte';
  import Icon from '../ui/Icon.svelte';
  import { createNote, updateNote, deleteNote } from '../../lib/db.js';
  import { toast } from '../../lib/stores/ui.svelte.js';
  import { cache } from '../../lib/utils/swrCache.js';

  let { open = false, note = null, uid, onclose = () => {}, onsaved = () => {} } = $props();

  const COLORS = ['#5B8CFF', '#22D3EE', '#34D399', '#FBBF24', '#FB7185', '#A78BFA'];

  let title = $state('');
  let content = $state('');
  let color = $state(COLORS[0]);
  let pinned = $state(false);
  let busy = $state(false);

  $effect(() => {
    if (open) {
      title = note?.title || '';
      content = note?.content || '';
      color = note?.color?.startsWith('#') ? note.color : COLORS[0];
      pinned = note?.pinned || false;
    }
  });

  async function save() {
    if (!title.trim() && !content.trim()) return toast('Write something first', 'warning');
    busy = true;
    try {
      if (note) await updateNote(note.id, { title, content, color, pinned });
      else await createNote(uid, { title, content, color, pinned });
      cache.invalidatePrefix('notes_');
      onsaved();
      onclose();
    } finally { busy = false; }
  }
  async function remove() {
    busy = true;
    try { await deleteNote(note.id); cache.invalidatePrefix('notes_'); onsaved(); onclose(); }
    finally { busy = false; }
  }
</script>

<Modal {open} {onclose} title={note ? 'Edit note' : 'New note'} maxWidth="440px">
  <div class="field">
    <input class="input" bind:value={title} placeholder="Title" maxlength="100" />
  </div>
  <div class="field">
    <textarea class="textarea" bind:value={content} placeholder="Start writing…" maxlength="2000" rows="6"></textarea>
  </div>
  <div class="meta">
    <div class="swatches">
      {#each COLORS as c (c)}
        <button class="sw" class:active={color === c} style="--c:{c}" onclick={() => (color = c)} aria-label="Colour"></button>
      {/each}
    </div>
    <button class="pin" class:on={pinned} onclick={() => (pinned = !pinned)}>
      <Icon name="pin" size={14} /> {pinned ? 'Pinned' : 'Pin'}
    </button>
  </div>
  <div class="actions">
    {#if note}<Button variant="danger" onclick={remove} icon="trash-2">Delete</Button>{/if}
    <div class="grow"></div>
    <Button variant="glass" onclick={onclose}>Cancel</Button>
    <Button variant="primary" loading={busy} onclick={save}>{note ? 'Save' : 'Create'}</Button>
  </div>
</Modal>

<style>
  .meta { display: flex; align-items: center; justify-content: space-between; margin: 4px 0 16px; }
  .swatches { display: flex; gap: 8px; }
  .sw { width: 26px; height: 26px; border-radius: 50%; background: var(--c); border: 2px solid transparent; transition: transform var(--t-fast); }
  .sw.active { border-color: var(--text); transform: scale(1.15); }
  .pin { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-sm); color: var(--text-3); padding: 6px 10px; border-radius: var(--r-full); }
  .pin.on { color: var(--accent); background: rgba(var(--accent-rgb), 0.12); }
  .actions { display: flex; align-items: center; gap: 10px; }
</style>
