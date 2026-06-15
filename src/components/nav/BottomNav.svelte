<script>
  import { navigate, router } from '../../lib/router.svelte.js';
  import { haptic } from '../../lib/utils/feedback.js';
  import Icon from '../ui/Icon.svelte';

  const tabs = [
    { id: 'dashboard', icon: 'house', label: 'Home' },
    { id: 'tasks', icon: 'check-square', label: 'Tasks' },
    { id: 'focus', icon: 'timer', label: 'Focus' },
    { id: 'profile', icon: 'trophy', label: 'You' },
  ];
  function active(id) { return router.path === id; }
  function go(id) { haptic('tap'); navigate(id); }
</script>

<nav class="bn">
  {#each tabs as t (t.id)}
    <button class="tab" class:active={active(t.id)} onclick={() => go(t.id)} aria-label={t.label} aria-current={active(t.id) ? 'page' : undefined}>
      <Icon name={t.icon} size={25} stroke={active(t.id) ? 2.4 : 1.85} />
      <span>{t.label}</span>
    </button>
  {/each}
</nav>

<style>
  .bn {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 60;
    height: calc(var(--nav-h) + env(safe-area-inset-bottom, 0));
    padding-bottom: env(safe-area-inset-bottom, 0);
    display: grid; grid-template-columns: repeat(4, 1fr); align-items: stretch;
    background: var(--bg-1); border-top: 1px solid var(--glass-border);
  }
  .tab {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
    color: var(--text-3); font-size: 10px; font-weight: 600; letter-spacing: 0.01em;
    transition: color var(--t-fast);
  }
  .tab :global(svg) { transition: transform var(--t-fast) var(--ease-spring); }
  .tab.active { color: var(--accent); }
  .tab.active :global(svg) { transform: translateY(-1px); }
  .tab:active :global(svg) { transform: scale(0.88); }
  @media (min-width: 1024px) { .bn { display: none; } }
</style>
