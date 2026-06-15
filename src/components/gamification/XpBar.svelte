<script>
  import { gamification as g } from '../../lib/stores/gamification.svelte.js';
  import { navigate } from '../../lib/router.svelte.js';
  import ProgressBar from '../ui/ProgressBar.svelte';
  import AnimatedNumber from '../ui/AnimatedNumber.svelte';

  const p = $derived(g.progress);
</script>

<button class="xpbar glass" onclick={() => navigate('profile')} aria-label="Open profile">
  <div class="lvl">
    <span class="lvl-num">{p.level}</span>
    <span class="lvl-cap">LV</span>
  </div>
  <div class="mid">
    <div class="row">
      <span class="title">{g.title}</span>
      <span class="xp text-xs muted"><AnimatedNumber value={p.into} />/{p.span} XP</span>
    </div>
    <ProgressBar value={p.pct} height={7} />
  </div>
</button>

<style>
  .xpbar { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border-radius: var(--r-lg); text-align: left; }
  .lvl { position: relative; flex-shrink: 0; width: 42px; height: 42px; display: grid; place-items: center; border-radius: var(--r-full); background: var(--accent); color: #fff; }
  .lvl-num { font-size: 18px; font-weight: 800; line-height: 1; }
  .lvl-cap { position: absolute; bottom: 5px; font-size: 7px; font-weight: 800; letter-spacing: 0.1em; opacity: 0.8; }
  .mid { flex: 1; min-width: 0; }
  .row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
  .title { font-size: var(--fs-sm); font-weight: 700; }
</style>
