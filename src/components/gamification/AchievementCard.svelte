<script>
  import Icon from '../ui/Icon.svelte';
  let { achievement, unlockedAt = null } = $props();
  const unlocked = $derived(!!unlockedAt);
</script>

<div class="ach" class:unlocked title={achievement.desc}>
  <div class="ic"><Icon name={achievement.icon} size={20} /></div>
  <div class="meta">
    <div class="name">{achievement.name}</div>
    <div class="desc text-xs muted">{achievement.desc}</div>
  </div>
  {#if !unlocked}<div class="lock"><Icon name="lock" size={13} /></div>{/if}
</div>

<style>
  .ach { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: var(--r-md); background: var(--glass-bg); border: 1px solid var(--glass-border); opacity: 0.55; transition: opacity var(--t-med), transform var(--t-fast); }
  .ach.unlocked { opacity: 1; }
  .ach .ic { width: 42px; height: 42px; flex-shrink: 0; display: grid; place-items: center; border-radius: var(--r-full); background: var(--glass-bg-strong); color: var(--text-3); }
  .ach.unlocked .ic { background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: var(--text-on-accent); box-shadow: 0 6px 18px rgba(var(--accent-rgb), 0.4); }
  .meta { flex: 1; min-width: 0; }
  .name { font-weight: 700; font-size: var(--fs-sm); }
  .desc { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lock { color: var(--text-3); }
</style>
