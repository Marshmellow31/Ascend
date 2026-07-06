<script>
  import { navigate } from '../../lib/router.svelte.js';
  import { gamification as g } from '../../lib/stores/gamification.svelte.js';
  import { authStore } from '../../lib/stores/auth.svelte.js';
  import { cache } from '../../lib/utils/swrCache.js';
  import Icon from '../ui/Icon.svelte';

  const p = $derived(g.progress);
  const streak = $derived(cache.get(`dashboard_${authStore.uid}`)?.analytics?.streak ?? 0);
</script>

<header class="app-header">
  <div class="inner">
    <button class="brand" onclick={() => navigate('dashboard')}>
      <span class="logo"><Icon name="zap" size={16} stroke={2.5} /></span>
      <span class="wordmark">ASCEND</span>
    </button>
    <div class="actions">
      <div class="pill streak"><Icon name="flame" size={13} stroke={2.5} />{streak}</div>
      <button class="pill lv" onclick={() => navigate('profile')} aria-label="Profile">
        LV {p.level}
        <span class="mini-track"><span class="mini-fill" style="width:{p.pct}%"></span></span>
      </button>
    </div>
  </div>
</header>

<style>
  .app-header {
    position: sticky; top: 0; z-index: 50; padding-top: env(safe-area-inset-top, 0);
    background: rgba(10, 10, 14, 0.9);
    -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--divider);
  }
  .inner {
    height: var(--header-h); display: flex; align-items: center; justify-content: space-between;
    max-width: var(--maxw); margin: 0 auto; padding: 0 20px;
  }
  .brand { display: flex; align-items: center; gap: 9px; }
  .logo {
    width: 28px; height: 28px; border-radius: 9px; background: var(--accent); color: var(--text-on-accent);
    display: flex; align-items: center; justify-content: center;
  }
  .wordmark { font-size: 16px; font-weight: 900; letter-spacing: -0.4px; color: var(--text); }
  .actions { display: flex; align-items: center; gap: 8px; }
  .pill {
    display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: var(--r-full);
    background: var(--bg-2); border: 1px solid var(--border-raised);
    font-size: 12px; font-weight: 800;
  }
  .pill.streak { color: var(--accent); }
  .pill.lv { color: var(--text); }
  .mini-track { width: 44px; height: 5px; border-radius: 99px; background: var(--track); overflow: hidden; display: inline-block; }
  .mini-fill { display: block; height: 100%; background: var(--accent); border-radius: 99px; transition: width 0.6s var(--ease); }
  @media (min-width: 1024px) {
    .app-header { display: none; }
  }
</style>
