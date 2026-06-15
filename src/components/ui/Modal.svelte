<script>
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import Icon from './Icon.svelte';

  let { open = false, title = '', onclose = () => {}, maxWidth = '460px', children, footer = null } = $props();

  function onKey(e) { if (e.key === 'Escape' && open) onclose(); }

  $effect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  });
</script>

<svelte:window onkeydown={onKey} />

{#if open}
  <div
    class="backdrop"
    transition:fade={{ duration: 170 }}
    onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
    role="presentation"
  >
    <div
      class="panel glass"
      style="max-width:{maxWidth}"
      transition:fly={{ y: 34, duration: 280, easing: cubicOut }}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
    >
      {#if title}
        <div class="head">
          <h2>{title}</h2>
          <button class="btn-icon" onclick={onclose} aria-label="Close"><Icon name="x" size={18} /></button>
        </div>
      {/if}
      <div class="body">{@render children?.()}</div>
      {#if footer}<div class="foot">{@render footer()}</div>{/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center;
    padding: 16px; background: rgba(3, 4, 8, 0.55); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  }
  .panel { width: 100%; max-height: 90dvh; display: flex; flex-direction: column; border-radius: var(--r-xl) !important; overflow: hidden; margin: auto; }
  .head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 10px; }
  .head h2 { font-size: 18px; }
  .body { padding: 6px 20px 20px; overflow-y: auto; }
  .foot { padding: 14px 20px; border-top: 1px solid var(--glass-border); display: flex; gap: 10px; }
  .btn-icon { color: var(--text-2); }
  .btn-icon:hover { color: var(--text); }


</style>
