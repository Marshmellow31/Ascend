<script>
  import Ring from '../ui/Ring.svelte';
  let { completed = 0, target = 3 } = $props();
  const pct = $derived(target > 0 ? Math.min(100, (completed / target) * 100) : 0);
  const done = $derived(completed >= target && target > 0);
  const left = $derived(Math.max(0, target - completed));
</script>

<div class="dgr glass">
  <Ring value={pct} size={104} stroke={10}>
    <span class="num">{completed}<span class="den">/{target}</span></span>
    <span class="lbl">today</span>
  </Ring>
  <div class="info">
    <div class="t">{done ? 'Ring closed!' : 'Daily goal'}</div>
    <div class="s text-sm text-2">
      {done ? 'Nice work — you hit today’s goal.' : `${left} more task${left === 1 ? '' : 's'} to close your ring.`}
    </div>
  </div>
</div>

<style>
  .dgr { display: flex; align-items: center; gap: 18px; padding: 16px; border-radius: var(--r-lg); }
  .num { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
  .den { font-size: 14px; color: var(--text-3); font-weight: 700; }
  .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); margin-top: 2px; }
  .info { flex: 1; }
  .t { font-weight: 800; font-size: 17px; }
  .s { margin-top: 2px; }
</style>
