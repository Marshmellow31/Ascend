<script>
  import Icon from '../ui/Icon.svelte';
  let { achievement, unlockedAt = null } = $props();
  const unlocked = $derived(!!unlockedAt);
</script>

<div class="ach" class:unlocked title={achievement.desc}>
  <div class="ic"><Icon name={achievement.icon} size={22} stroke={2.2} /></div>
  <div class="meta">
    <div class="name">{achievement.name}</div>
    <div class="desc">{achievement.desc}</div>
  </div>
  <div class="status">{unlocked ? 'UNLOCKED' : 'LOCKED'}</div>
</div>

<style>
  .ach {
    display: flex; flex-direction: column; gap: 10px; padding: 18px;
    border-radius: 18px; background: var(--bg-1); border: 1px solid #1A1A20;
    opacity: 0.55; transition: opacity var(--t-med);
  }
  .ach.unlocked { opacity: 1; border-color: var(--track); }
  .ic {
    width: 44px; height: 44px; flex-shrink: 0; display: grid; place-items: center;
    border-radius: 14px; background: #1E1E26; color: var(--text-4);
  }
  .ach.unlocked .ic { background: var(--accent-glow); color: var(--accent); }
  .meta { min-width: 0; }
  .name { font-weight: 800; font-size: 14.5px; }
  .desc { font-size: 12px; color: var(--text-2); font-weight: 600; margin-top: 2px; }
  .status { font-size: 11px; font-weight: 800; letter-spacing: 0.5px; color: var(--text-4); }
  .ach.unlocked .status { color: var(--accent); }
</style>
