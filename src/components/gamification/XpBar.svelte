<script>
  import { gamification as g } from '../../lib/stores/gamification.svelte.js';
  import { navigate } from '../../lib/router.svelte.js';
  import AnimatedNumber from '../ui/AnimatedNumber.svelte';

  const p = $derived(g.progress);
</script>

<button class="xpbar" onclick={() => navigate('profile')} aria-label="Open profile">
  <div class="row">
    <span class="lvl">LEVEL {p.level}</span>
    <span class="title">{g.title}</span>
  </div>
  <div class="track"><div class="fill" style="width:{p.pct}%"></div></div>
  <div class="nums"><AnimatedNumber value={p.into} /> / {p.span} XP</div>
</button>

<style>
  .xpbar {
    display: block; width: 100%; padding: 14px; border-radius: 16px; text-align: left;
    background: linear-gradient(135deg, #17171E, #111116); border: 1px solid #22222A;
    transition: border-color var(--t-fast);
  }
  .xpbar:hover { border-color: var(--border-hover); }
  .row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .lvl { font-size: 11px; font-weight: 800; letter-spacing: 1.2px; color: var(--text-2); }
  .title { font-size: 12px; font-weight: 800; color: var(--accent); }
  .track { height: 7px; border-radius: 99px; background: var(--track); overflow: hidden; margin-bottom: 7px; }
  .fill { height: 100%; border-radius: 99px; background: var(--accent); transition: width 0.6s var(--ease); }
  .nums { font-size: 11.5px; color: var(--text-2); font-weight: 600; }
</style>
