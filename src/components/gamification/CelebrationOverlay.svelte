<script>
  import { scale, fade } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import { ui } from '../../lib/stores/ui.svelte.js';
  import Icon from '../ui/Icon.svelte';

  const c = $derived(ui.celebration);

  $effect(() => {
    if (!c) return;
    const t = setTimeout(() => ui.clearCelebration(), 2700);
    return () => clearTimeout(t);
  });
</script>

{#if c}
  <button class="cel" transition:fade={{ duration: 200 }} onclick={() => ui.clearCelebration()} aria-label="Dismiss celebration">
    <div class="card glass glass-strong" transition:scale={{ start: 0.7, duration: 440, easing: backOut }}>
      <div class="halo"></div>
      <div class="icon"><Icon name={c.icon || 'sparkles'} size={42} /></div>
      <div class="title gradient-text">{c.title}</div>
      {#if c.subtitle}<div class="sub text-2">{c.subtitle}</div>{/if}
    </div>
  </button>
{/if}

<style>
  .cel { position: fixed; inset: 0; z-index: 1400; display: grid; place-items: center; background: rgba(3, 4, 8, 0.5); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); border: none; }
  .card { position: relative; padding: 36px 40px; border-radius: var(--r-xl); text-align: center; overflow: hidden; }
  .halo { position: absolute; inset: -40% 10%; background: radial-gradient(circle, rgba(var(--accent-rgb), 0.5), transparent 60%); filter: blur(30px); animation: pulse 2s ease-in-out infinite; }
  .icon { position: relative; width: 84px; height: 84px; margin: 0 auto 14px; display: grid; place-items: center; border-radius: var(--r-full); background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: var(--text-on-accent); box-shadow: 0 10px 40px rgba(var(--accent-rgb), 0.5); }
  .title { position: relative; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
  .sub { position: relative; margin-top: 4px; }
  @keyframes pulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
  @media (prefers-reduced-motion: reduce) { .halo { animation: none; } }
</style>
