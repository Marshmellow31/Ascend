<script>
  import { navigate, router } from '../../lib/router.svelte.js';
  import { haptic } from '../../lib/utils/feedback.js';
  import Icon from '../ui/Icon.svelte';

  const tabs = [
    { id: 'dashboard', icon: 'house', label: 'Home' },
    { id: 'tasks', icon: 'check-square', label: 'Tasks' },
    { id: 'focus', icon: 'timer', label: 'Focus' },
    { id: 'analytics', icon: 'bar-chart-2', label: 'Insights' },
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
    position: fixed; bottom: max(16px, env(safe-area-inset-bottom, 16px)); left: 16px; right: 16px; z-index: 60;
    height: var(--nav-h);
    display: grid; grid-template-columns: repeat(4, 1fr); align-items: stretch;
    background: var(--glass-bg);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    border-radius: var(--r-full);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
  }
  .tab {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    color: var(--text-3); font-size: 11px; font-weight: 500; letter-spacing: 0.01em;
    transition: color var(--t-fast);
  }
  .tab :global(svg) { transition: transform var(--t-fast) var(--ease-spring); }
  .tab.active { color: var(--accent); }
  .tab.active :global(svg) { transform: translateY(-2px); }
  .tab:active :global(svg) { transform: scale(0.85); }
  @media (min-width: 1024px) { .bn { display: none; } }
</style>
