<script>
  let { value = 0, height = 8, gradient = true, color = 'var(--accent)', track = 'var(--glass-border)' } = $props();
  const pct = $derived(Math.max(0, Math.min(100, value)));
</script>

<div class="bar" style="height:{height}px;background:{track}">
  <div class="fill" style="width:{pct}%;background:{gradient ? 'linear-gradient(90deg, var(--accent), var(--accent-2))' : color}"></div>
</div>

<style>
  .bar { width: 100%; border-radius: 999px; overflow: hidden; }
  .fill { height: 100%; border-radius: 999px; transition: width 0.8s var(--ease); }
</style>
