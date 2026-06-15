<script>
  import { fly } from 'svelte/transition';
  import Icon from '../ui/Icon.svelte';
  import Button from '../ui/Button.svelte';

  let show = $state(false);

  const isStandalone = () =>
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

  function maybeShow() {
    if (isStandalone()) return;
    const dismissed = localStorage.getItem('install_dismissed');
    if (dismissed && Date.now() - +dismissed < 3 * 864e5) return;
    if (window.__deferredPrompt) setTimeout(() => { if (window.__deferredPrompt) show = true; }, 3500);
  }

  $effect(() => {
    if (window.__deferredPrompt) maybeShow();
    else window.addEventListener('pwa-prompt-ready', maybeShow, { once: true });
  });

  async function install() {
    const p = window.__deferredPrompt;
    if (!p) return;
    p.prompt();
    await p.userChoice;
    window.__deferredPrompt = null;
    show = false;
  }
  function dismiss() { show = false; localStorage.setItem('install_dismissed', String(Date.now())); }
</script>

{#if show}
  <div class="ib glass glass-strong" transition:fly={{ y: 24, duration: 280 }}>
    <div class="ic"><Icon name="download" size={18} /></div>
    <div class="txt">
      <div class="t">Install Ascend</div>
      <div class="s text-xs muted">Add to your home screen for the full app feel</div>
    </div>
    <Button variant="primary" size="sm" onclick={install}>Install</Button>
    <button class="x" onclick={dismiss} aria-label="Dismiss"><Icon name="x" size={16} /></button>
  </div>
{/if}

<style>
  .ib {
    position: fixed; z-index: 800; left: 50%; transform: translateX(-50%);
    bottom: calc(var(--nav-h) + env(safe-area-inset-bottom, 0) + 14px);
    width: min(92vw, 440px); display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--r-lg);
  }
  .ic { width: 38px; height: 38px; flex-shrink: 0; display: grid; place-items: center; border-radius: var(--r-md); background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: var(--text-on-accent); }
  .txt { flex: 1; min-width: 0; }
  .t { font-weight: 700; font-size: var(--fs-sm); }
  .x { color: var(--text-3); padding: 4px; }
  @media (min-width: 1024px) { .ib { left: auto; right: 24px; transform: none; bottom: 24px; } }
</style>
