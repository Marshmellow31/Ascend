<script>
  import { authStore } from './lib/stores/auth.svelte.js';
  import { theme } from './lib/stores/theme.svelte.js';
  import { ui } from './lib/stores/ui.svelte.js';

  import Auth from './auth/Auth.svelte';
  import Verify from './auth/Verify.svelte';
  import Header from './components/nav/Header.svelte';
  import BottomNav from './components/nav/BottomNav.svelte';
  import Sidebar from './components/nav/Sidebar.svelte';
  import CommandPalette from './components/nav/CommandPalette.svelte';
  import QuickCapture from './components/nav/QuickCapture.svelte';
  import InstallBanner from './components/nav/InstallBanner.svelte';
  import RouteOutlet from './RouteOutlet.svelte';
  import ToastHost from './components/ui/ToastHost.svelte';
  import ConfirmHost from './components/ui/ConfirmHost.svelte';
  import CelebrationOverlay from './components/gamification/CelebrationOverlay.svelte';

  theme.apply();
  authStore.init();

  // Hide the HTML splash once auth resolves
  $effect(() => {
    if (authStore.status !== 'loading') document.getElementById('app-splash')?.classList.add('hide');
  });

  function onKey(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ui.togglePalette(); }
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="app-bg"><div class="orb orb-1"></div><div class="orb orb-2"></div><div class="orb orb-3"></div></div>

{#if authStore.status === 'unauth'}
  <Auth />
{:else if authStore.status === 'verify'}
  <Verify />
{:else if authStore.status === 'ready'}
  <Sidebar />
  <Header />
  <main class="app-main">
    <RouteOutlet />
  </main>
  <BottomNav />
  <InstallBanner />
{/if}

<ToastHost />
<ConfirmHost />
<CommandPalette />
<QuickCapture />
<CelebrationOverlay />

<style>
  .app-main {
    margin: 0 auto; max-width: var(--maxw);
    padding: 6px 16px calc(var(--nav-h) + env(safe-area-inset-bottom, 0) + 28px);
  }
  @media (min-width: 1024px) {
    .app-main { margin-left: var(--sidebar-w); max-width: none; padding: 28px 48px 56px; }
    .app-main > :global(.route) { max-width: 1060px; margin: 0 auto; }
  }
</style>
