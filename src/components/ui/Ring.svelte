<script>
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  let {
    value = 0, size = 96, stroke = 9, animate = true,
    trackColor = 'var(--glass-border)', children,
  } = $props();

  const id = 'rg' + Math.random().toString(36).slice(2, 8);
  const pct = new Tween(0, { duration: animate ? 950 : 0, easing: cubicOut });
  $effect(() => { pct.target = Math.max(0, Math.min(100, value)); });

  const r = $derived((size - stroke) / 2);
  const circ = $derived(2 * Math.PI * r);
  const offset = $derived(circ * (1 - pct.current / 100));
</script>

<div class="ring" style="width:{size}px;height:{size}px">
  <svg width={size} height={size} viewBox="0 0 {size} {size}">
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="var(--accent)" />
        <stop offset="1" stop-color="var(--accent-2)" />
      </linearGradient>
      <filter id="{id}-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="var(--accent)" flood-opacity="0.4" />
      </filter>
    </defs>
    <circle cx={size / 2} cy={size / 2} {r} fill="none" stroke={trackColor} stroke-width={stroke} />
    <circle
      cx={size / 2} cy={size / 2} {r} fill="none" stroke="url(#{id})" stroke-width={stroke}
      stroke-linecap="round" stroke-dasharray={circ} stroke-dashoffset={offset}
      transform="rotate(-90 {size / 2} {size / 2})"
      filter="url(#{id}-glow)"
    />
  </svg>
  <div class="ring-center">{@render children?.()}</div>
</div>

<style>
  .ring { position: relative; display: inline-grid; place-items: center; }
  .ring svg { position: absolute; inset: 0; }
  .ring-center { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; line-height: 1.1; }
</style>
