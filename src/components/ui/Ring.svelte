<script>
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  let {
    value = 0, size = 96, stroke = 9, animate = true,
    trackColor = 'var(--track)', children,
  } = $props();

  const pct = new Tween(0, { duration: animate ? 800 : 0, easing: cubicOut });
  $effect(() => { pct.target = Math.max(0, Math.min(100, value)); });

  const r = $derived((size - stroke) / 2);
  const circ = $derived(2 * Math.PI * r);
  const offset = $derived(circ * (1 - pct.current / 100));
</script>

<div class="ring" style="width:{size}px;height:{size}px">
  <svg width={size} height={size} viewBox="0 0 {size} {size}">
    <circle cx={size / 2} cy={size / 2} {r} fill="none" stroke={trackColor} stroke-width={stroke} />
    <circle
      cx={size / 2} cy={size / 2} {r} fill="none" stroke="var(--accent)" stroke-width={stroke}
      stroke-linecap="round" stroke-dasharray={circ} stroke-dashoffset={offset}
      transform="rotate(-90 {size / 2} {size / 2})"
    />
  </svg>
  <div class="ring-center">{@render children?.()}</div>
</div>

<style>
  .ring { position: relative; display: inline-grid; place-items: center; }
  .ring svg { position: absolute; inset: 0; }
  .ring-center { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; line-height: 1.1; }
</style>
