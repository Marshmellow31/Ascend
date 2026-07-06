<script>
  import { navigate, router } from '../../lib/router.svelte.js';
  import { gamification as g } from '../../lib/stores/gamification.svelte.js';
  import { authStore } from '../../lib/stores/auth.svelte.js';
  import { cache } from '../../lib/utils/swrCache.js';
  import { ROUTES } from '../../lib/nav.js';
  import Icon from '../ui/Icon.svelte';

  const p = $derived(g.progress);
  const streak = $derived(cache.get(`dashboard_${authStore.uid}`)?.analytics?.streak ?? 0);

  function active(id) {
    const path = router.path;
    if (id === 'growth') return path === 'growth' || path === 'personalDevelopment';
    return path === id;
  }
</script>

<aside class="sidebar">
  <button class="brand" onclick={() => navigate('dashboard')}>
    <span class="logo"><Icon name="zap" size={19} stroke={2.5} /></span>
    <span class="wordmark">ASCEND</span>
  </button>

  <nav class="links">
    {#each ROUTES as r (r.id)}
      <button class="link" class:active={active(r.id)} onclick={() => navigate(r.id)}>
        <Icon name={r.icon} size={19} stroke={active(r.id) ? 2.5 : 2} />
        <span>{r.label}</span>
      </button>
    {/each}
  </nav>

  <div class="spacer"></div>

  <!-- XP module -->
  <button class="xpmod" onclick={() => navigate('profile')} aria-label="Open profile">
    <div class="xp-row">
      <span class="xp-lvl">LEVEL {p.level}</span>
      <span class="xp-streak"><Icon name="flame" size={13} stroke={2.5} />{streak}</span>
    </div>
    <div class="xp-track"><div class="xp-fill" style="width:{p.pct}%"></div></div>
    <div class="xp-nums">{p.into} / {p.span} XP</div>
  </button>
</aside>

<style>
  .sidebar {
    display: none; position: fixed; top: 0; left: 0; bottom: 0; width: var(--sidebar-w); z-index: 60;
    flex-direction: column; padding: 20px 12px;
    background: var(--bg-nav); border-right: 1px solid var(--divider);
  }
  .brand { display: flex; align-items: center; gap: 10px; padding: 8px 12px 24px; }
  .logo {
    width: 34px; height: 34px; border-radius: 10px; background: var(--accent); color: var(--text-on-accent);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .wordmark { font-size: 19px; font-weight: 900; letter-spacing: -0.5px; color: var(--text); }

  .links { display: flex; flex-direction: column; gap: 2px; }
  .link {
    display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 12px;
    color: var(--text-nav); font-weight: 600; font-size: 14.5px; text-align: left; transition: background var(--t-fast), color var(--t-fast);
  }
  .link:hover { background: #1B1B22; }
  .link.active { background: var(--bg-active); color: var(--accent); font-weight: 800; }
  .spacer { flex: 1; }

  .xpmod {
    margin: 0 4px; padding: 14px; border-radius: 16px; text-align: left;
    background: linear-gradient(135deg, #17171E, #111116); border: 1px solid #22222A;
    transition: border-color var(--t-fast);
  }
  .xpmod:hover { border-color: var(--border-hover); }
  .xp-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .xp-lvl { font-size: 11px; font-weight: 800; letter-spacing: 1.2px; color: var(--text-2); }
  .xp-streak { display: flex; align-items: center; gap: 4px; color: var(--accent); font-size: 12px; font-weight: 800; }
  .xp-track { height: 7px; border-radius: 99px; background: var(--track); overflow: hidden; margin-bottom: 7px; }
  .xp-fill { height: 100%; border-radius: 99px; background: var(--accent); transition: width 0.6s var(--ease); }
  .xp-nums { font-size: 11.5px; color: var(--text-2); font-weight: 600; }

  @media (min-width: 1024px) { .sidebar { display: flex; } }
</style>
