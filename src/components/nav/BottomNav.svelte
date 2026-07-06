<script>
  import { navigate, router } from '../../lib/router.svelte.js';
  import { haptic } from '../../lib/utils/feedback.js';
  import Icon from '../ui/Icon.svelte';

  const tabs = [
    { id: 'dashboard', icon: 'house', label: 'Home' },
    { id: 'tasks', icon: 'list-checks', label: 'Tasks' },
    { id: 'focus', icon: 'timer', label: 'Focus' },
    { id: 'analytics', icon: 'bar-chart-2', label: 'Insights' },
    { id: 'profile', icon: 'user', label: 'Profile' },
  ];
  function active(id) { return router.path === id; }
  function go(id) { haptic('tap'); navigate(id); }
</script>

<nav class="bn">
  <div class="bn-inner">
    {#each tabs as t (t.id)}
      <button class="tab" class:active={active(t.id)} onclick={() => go(t.id)} aria-label={t.label} aria-current={active(t.id) ? 'page' : undefined}>
        <Icon name={t.icon} size={22} stroke={active(t.id) ? 2.5 : 2} />
        <span>{t.label}</span>
      </button>
    {/each}
  </div>
</nav>

<style>
  .bn {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 60;
    background: rgba(13, 13, 18, 0.92);
    -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
    border-top: 1px solid var(--divider);
    padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px));
  }
  .bn-inner { display: flex; justify-content: space-around; max-width: 500px; margin: 0 auto; }
  .tab {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 8px 14px; min-width: 56px; border-radius: 12px;
    color: var(--text-3); font-size: 10px; font-weight: 800;
    transition: color var(--t-fast);
  }
  .tab :global(svg) { transition: transform var(--t-fast) var(--ease-spring); }
  .tab.active { color: var(--accent); }
  .tab:active :global(svg) { transform: scale(0.85); }
  @media (min-width: 1024px) { .bn { display: none; } }
</style>
