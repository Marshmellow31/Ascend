<script>
  import Icon from '../ui/Icon.svelte';
  let { note, onopen = () => {} } = $props();
  const color = $derived(note.color && note.color.startsWith('#') ? note.color : 'var(--accent)');
</script>

<button class="note glass" style="--nc:{color}" onclick={() => onopen(note)}>
  {#if note.pinned}<span class="pin"><Icon name="pin" size={11} /></span>{/if}
  <div class="title">{note.title || 'Untitled'}</div>
  {#if note.content}<div class="excerpt">{note.content.slice(0, 90)}{note.content.length > 90 ? '…' : ''}</div>{/if}
</button>

<style>
  .note { position: relative; text-align: left; padding: 13px 14px; border-radius: var(--r-md); border-top: 3px solid var(--nc); min-height: 76px; transition: transform var(--t-fast); }
  .note:active { transform: scale(0.98); }
  .pin { position: absolute; top: 10px; right: 10px; color: var(--nc); }
  .title { font-weight: 700; font-size: var(--fs-sm); margin-bottom: 4px; padding-right: 16px; }
  .excerpt { font-size: var(--fs-xs); color: var(--text-3); line-height: 1.45; }
</style>
