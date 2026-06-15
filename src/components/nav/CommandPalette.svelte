<script>
  import { fade, fly } from 'svelte/transition';
  import { ui } from '../../lib/stores/ui.svelte.js';
  import { navigate } from '../../lib/router.svelte.js';
  import { theme } from '../../lib/stores/theme.svelte.js';
  import { authStore } from '../../lib/stores/auth.svelte.js';
  import { createTask } from '../../lib/db.js';
  import { cache } from '../../lib/utils/swrCache.js';
  import { toast } from '../../lib/stores/ui.svelte.js';
  import { ROUTES } from '../../lib/nav.js';
  import Icon from '../ui/Icon.svelte';

  let q = $state('');
  let sel = $state(0);
  let inputEl = $state(null);

  const baseCommands = [
    ...ROUTES.map((r) => ({ id: 'go-' + r.id, icon: r.icon, label: r.label, hint: 'Go to', run: () => navigate(r.id) })),
    { id: 'new-task', icon: 'plus', label: 'New task', hint: 'Create', run: () => ui.openQuickCapture() },
    { id: 'start-focus', icon: 'timer', label: 'Start focus session', hint: 'Focus', run: () => navigate('focus') },
    { id: 'toggle-theme', icon: 'sun', label: 'Toggle light / dark', hint: 'Theme', run: () => theme.toggleMode() },
  ];

  const commands = $derived.by(() => {
    const query = q.trim().toLowerCase();
    let list = baseCommands;
    if (query) list = baseCommands.filter((c) => c.label.toLowerCase().includes(query));
    const out = [...list];
    if (query) out.unshift({ id: 'quick-task', icon: 'check-square', label: `Create task “${q.trim()}”`, hint: 'Enter', run: createQuickTask });
    return out;
  });

  $effect(() => { if (ui.paletteOpen) { q = ''; sel = 0; setTimeout(() => inputEl?.focus(), 40); } });
  $effect(() => { commands; sel = 0; });

  async function createQuickTask() {
    const uid = authStore.uid;
    const title = q.trim();
    if (!uid || !title) return;
    await createTask(uid, { title, priority: 'medium' });
    cache.invalidatePrefix('tasks_');
    window.dispatchEvent(new CustomEvent('data-changed', { detail: { kind: 'task' } }));
    toast('Task added', 'success');
  }

  function run(cmd) { ui.closePalette(); cmd.run(); }

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % commands.length; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + commands.length) % commands.length; }
    else if (e.key === 'Enter') { e.preventDefault(); if (commands[sel]) run(commands[sel]); }
    else if (e.key === 'Escape') { ui.closePalette(); }
  }
</script>

{#if ui.paletteOpen}
  <div class="cp-back" transition:fade={{ duration: 150 }} onclick={(e) => { if (e.target === e.currentTarget) ui.closePalette(); }} role="presentation">
    <div class="cp glass glass-strong" transition:fly={{ y: -16, duration: 240 }} role="dialog" aria-label="Command palette">
      <div class="cp-input">
        <Icon name="search" size={18} />
        <input bind:this={inputEl} bind:value={q} onkeydown={onKey} placeholder="Search or type a command…" aria-label="Command input" />
        <kbd>esc</kbd>
      </div>
      <div class="cp-list">
        {#each commands as cmd, i (cmd.id)}
          <button class="cp-item" class:active={i === sel} onclick={() => run(cmd)} onmouseenter={() => (sel = i)}>
            <Icon name={cmd.icon} size={17} />
            <span class="cp-label">{cmd.label}</span>
            <span class="cp-hint">{cmd.hint}</span>
          </button>
        {/each}
        {#if commands.length === 0}<div class="cp-empty muted">No matches</div>{/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .cp-back { position: fixed; inset: 0; z-index: 1300; display: flex; justify-content: center; align-items: flex-start; padding: 12vh 16px 16px; background: rgba(3, 4, 8, 0.5); -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px); }
  .cp { width: 100%; max-width: 560px; border-radius: var(--r-xl); overflow: hidden; }
  .cp-input { display: flex; align-items: center; gap: 10px; padding: 16px 18px; border-bottom: 1px solid var(--glass-border); color: var(--text-2); }
  .cp-input input { flex: 1; background: none; border: none; outline: none; font-size: 16px; color: var(--text); }
  kbd { font-size: 10px; padding: 3px 6px; border-radius: 6px; background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-3); }
  .cp-list { max-height: 56vh; overflow-y: auto; padding: 8px; }
  .cp-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 12px; border-radius: var(--r-md); color: var(--text-2); text-align: left; }
  .cp-item.active { background: var(--glass-bg-strong); color: var(--text); }
  .cp-item.active :global(svg) { color: var(--accent); }
  .cp-label { flex: 1; font-weight: 600; font-size: var(--fs-sm); }
  .cp-hint { font-size: var(--fs-xs); color: var(--text-3); }
  .cp-empty { padding: 24px; text-align: center; }
</style>
