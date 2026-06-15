<script>
  import { navigate } from '../../lib/router.svelte.js';
  import { ui } from '../../lib/stores/ui.svelte.js';
  import { gamification as g } from '../../lib/stores/gamification.svelte.js';
  import Icon from '../ui/Icon.svelte';
</script>

<header class="app-header">
  <div class="inner">
    <button class="brand" onclick={() => navigate('dashboard')}>Ascend</button>
    <div class="actions">
      <button class="btn-icon ghost" onclick={() => ui.openPalette()} aria-label="Search & commands" title="Search (Ctrl/⌘ K)">
        <Icon name="search" size={20} />
      </button>
      <button class="btn-icon ghost" onclick={() => ui.openQuickCapture()} aria-label="Quick add" title="Quick add">
        <Icon name="plus" size={23} />
      </button>
      <button class="avatar" onclick={() => navigate('profile')} aria-label="Profile">
        {g.level}
      </button>
    </div>
  </div>
</header>

<style>
  .app-header { position: sticky; top: 0; z-index: 50; padding-top: env(safe-area-inset-top, 0); }
  .inner {
    height: var(--header-h); display: flex; align-items: center; justify-content: space-between;
    max-width: var(--maxw); margin: 0 auto; padding: 0 16px;
  }
  .brand { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: var(--text); }
  .actions { display: flex; align-items: center; gap: 6px; }
  .ghost { color: var(--text-2); }
  .ghost:hover { color: var(--text); background: var(--glass-bg); }
  .avatar {
    width: 32px; height: 32px; border-radius: var(--r-full); margin-left: 4px;
    display: grid; place-items: center; font-weight: 700; font-size: 14px; color: #fff;
    background: var(--accent);
  }
  .avatar:active { transform: scale(0.92); }
  @media (min-width: 1024px) {
    .app-header { display: none; }
  }
</style>
