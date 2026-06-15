<script>
  import { fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { ui } from '../../lib/stores/ui.svelte.js';
  import Icon from './Icon.svelte';

  const ICONS = { success: 'circle-check', error: 'alert-circle', warning: 'alert-triangle', info: 'info' };
</script>

<div class="toast-host">
  {#each ui.toasts as t (t.id)}
    <div
      class="toast glass glass-strong toast-{t.type}"
      animate:flip={{ duration: 220 }}
      transition:fly={{ y: 24, duration: 240 }}
      role="status"
    >
      <Icon name={ICONS[t.type] || ICONS.info} size={18} />
      <span class="msg">{t.message}</span>
      <button class="x" onclick={() => ui.dismiss(t.id)} aria-label="Dismiss"><Icon name="x" size={15} /></button>
    </div>
  {/each}
</div>

<style>
  .toast-host {
    position: fixed; left: 50%; transform: translateX(-50%); z-index: 1200;
    bottom: calc(var(--nav-h) + env(safe-area-inset-bottom, 0) + 14px);
    display: flex; flex-direction: column; gap: 8px; width: min(92vw, 420px); pointer-events: none;
  }
  .toast {
    pointer-events: auto; display: flex; align-items: center; gap: 10px; padding: 12px 14px;
    border-radius: var(--r-md); font-size: var(--fs-sm); font-weight: 550;
  }
  .toast .msg { flex: 1; }
  .toast .x { color: var(--text-3); display: flex; }
  .toast-success { color: var(--text); border-left: 3px solid var(--success); }
  .toast-error { color: var(--text); border-left: 3px solid var(--danger); }
  .toast-warning { color: var(--text); border-left: 3px solid var(--warning); }
  .toast-info { color: var(--text); border-left: 3px solid var(--accent); }
  @media (min-width: 1024px) { .toast-host { bottom: 24px; left: auto; right: 24px; transform: none; } }
</style>
