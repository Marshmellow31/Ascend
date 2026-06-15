<script>
  import { navigate, router } from '../../lib/router.svelte.js';
  import { ui } from '../../lib/stores/ui.svelte.js';
  import { ROUTES } from '../../lib/nav.js';
  import Icon from '../ui/Icon.svelte';
  import XpBar from '../gamification/XpBar.svelte';

  function active(id) {
    const p = router.path;
    if (id === 'growth') return p === 'growth' || p === 'personalDevelopment';
    return p === id;
  }
</script>

<aside class="sidebar glass">
  <button class="brand gradient-text" onclick={() => navigate('dashboard')}>Ascend</button>

  <button class="quick btn-primary" onclick={() => ui.openQuickCapture()}>
    <Icon name="plus" size={18} /> Quick add
  </button>

  <nav class="links">
    {#each ROUTES as r (r.id)}
      <button class="link" class:active={active(r.id)} onclick={() => navigate(r.id)}>
        <Icon name={r.icon} size={19} />
        <span>{r.label}</span>
      </button>
    {/each}
  </nav>

  <div class="foot"><XpBar /></div>
</aside>

<style>
  .sidebar {
    display: none; position: fixed; top: 0; left: 0; bottom: 0; width: var(--sidebar-w); z-index: 60;
    flex-direction: column; padding: 22px 14px; border-radius: 0; border-top: none; border-bottom: none; border-left: none;
  }
  .brand { font-size: 23px; font-weight: 800; letter-spacing: -0.03em; padding: 4px 10px 18px; text-align: left; }
  .quick { width: 100%; margin-bottom: 18px; }
  .links { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .link {
    display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: var(--r-md);
    color: var(--text-2); font-weight: 600; font-size: var(--fs-sm); text-align: left; transition: all var(--t-fast);
  }
  .link:hover { color: var(--text); background: var(--glass-bg); }
  .link.active { color: var(--text); background: var(--glass-bg-strong); box-shadow: inset 3px 0 0 var(--accent); }
  .link.active :global(svg) { color: var(--accent); }
  .foot { margin-top: 14px; }
  @media (min-width: 1024px) { .sidebar { display: flex; } }
</style>
