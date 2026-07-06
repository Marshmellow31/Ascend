<script>
  import Ring from '../ui/Ring.svelte';
  let { completed = 0, target = 3 } = $props();
  const pct = $derived(target > 0 ? Math.min(100, (completed / target) * 100) : 0);
  const done = $derived(completed >= target && target > 0);
  const left = $derived(Math.max(0, target - completed));
</script>

<div class="dgr">
  <div class="glow"></div>
  <div class="microlabel">Daily goal</div>
  <Ring value={pct} size={170} stroke={14}>
    <span class="num">{completed}<span class="den">/{target}</span></span>
    <span class="lbl">tasks done</span>
  </Ring>
  <div class="msg">{done ? 'Goal crushed! 🎯' : `${left} more to hit your goal`}</div>
</div>

<style>
  .dgr {
    position: relative; overflow: hidden;
    border-radius: 24px; background: var(--grad-card); border: 1px solid var(--border-raised);
    padding: 26px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
  }
  .glow {
    position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; border-radius: 50%;
    background: var(--accent-glow); filter: blur(60px); animation: pulse-glow 4s ease-in-out infinite;
    pointer-events: none;
  }
  .num { font-size: 44px; font-weight: 900; letter-spacing: -2px; line-height: 1; }
  .den { font-size: 22px; color: var(--text-4); }
  .lbl { font-size: 11.5px; font-weight: 700; color: var(--text-2); margin-top: 4px; }
  .msg { font-size: 13px; font-weight: 700; color: var(--accent); position: relative; }
</style>
