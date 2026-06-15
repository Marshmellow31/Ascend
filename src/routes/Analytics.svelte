<script>
  import { onMount } from 'svelte';
  import { authStore } from '../lib/stores/auth.svelte.js';
  import { getSubjects, getFocusSessions } from '../lib/db.js';
  import { computeAnalytics, computeFocusStats } from '../lib/logic/analytics.js';
  import { cache } from '../lib/utils/swrCache.js';

  import StatCard from '../components/ui/StatCard.svelte';
  import ProgressBar from '../components/ui/ProgressBar.svelte';
  import Skeleton from '../components/ui/Skeleton.svelte';
  import XpBar from '../components/gamification/XpBar.svelte';
  import Icon from '../components/ui/Icon.svelte';

  const uid = authStore.uid;
  const profile = $derived(authStore.profile);
  const cached = cache.get(`analytics_${uid}`);
  let a = $state(cached?.a || null);
  let focus = $state(cached?.focus || { focusSessions: 0, focusMinutes: 0 });
  let loading = $state(!cached);

  async function load() {
    const subjects = await getSubjects(uid);
    const [analytics, sessions] = await Promise.all([
      computeAnalytics(uid, profile?.weekStartDay || 'monday', subjects),
      getFocusSessions(uid),
    ]);
    a = analytics; focus = computeFocusStats(sessions); loading = false;
    cache.set(`analytics_${uid}`, { a, focus });
  }
  onMount(load);

  // Heatmap weeks (24 cols x 7 rows)
  const weeks = $derived.by(() => {
    if (!a?.heatmapData) return [];
    const out = [];
    for (let i = 0; i < a.heatmapData.length; i += 7) out.push(a.heatmapData.slice(i, i + 7));
    return out;
  });
  function level(c) { return c === 0 ? 0 : c < 2 ? 1 : c < 4 ? 2 : c < 6 ? 3 : 4; }
  const focusH = $derived(Math.floor(focus.focusMinutes / 60));
  const focusM = $derived(focus.focusMinutes % 60);
</script>

<header class="ph"><h1>Insights</h1></header>

{#if loading}
  <div class="grid2"><Skeleton height="80px" /><Skeleton height="80px" /><Skeleton height="80px" /><Skeleton height="80px" /></div>
  <Skeleton height="150px" />
{:else}
  <div style="margin-bottom: 24px;"><XpBar /></div>
  <div class="grid2">
    <StatCard value={a.completionRate} suffix="%" label="Completion" />
    <StatCard value={a.completed} label="Done this week" />
    <StatCard value={a.streak} label="Day streak" icon="flame" />
    <StatCard value={focusH > 0 ? `${focusH}h ${focusM}m` : `${focusM}m`} label="Focus time" animate={false} />
  </div>

  {#if a.insights?.length}
    <div class="section-head"><h2>Key insights</h2></div>
    <div class="insights">
      {#each a.insights as ins (ins)}
        <div class="ins glass"><Icon name="sparkles" size={15} /><span>{ins}</span></div>
      {/each}
    </div>
  {/if}

  <div class="section-head"><h2>Consistency</h2><span class="text-xs muted">last 24 weeks</span></div>
  <div class="heat glass">
    <div class="heat-grid">
      {#each weeks as week, wi (wi)}
        <div class="hcol">
          {#each week as day (day.date)}
            <span class="hcell l{level(day.count)}" title="{day.date}: {day.count}"></span>
          {/each}
        </div>
      {/each}
    </div>
    <div class="legend text-xs muted">
      Less <span class="hcell l0"></span><span class="hcell l1"></span><span class="hcell l2"></span><span class="hcell l3"></span><span class="hcell l4"></span> More
    </div>
  </div>

  {#if a.topicBreakdown?.some((t) => t.total > 0)}
    <div class="section-head"><h2>Focus by topic</h2></div>
    <div class="topics glass">
      {#each a.topicBreakdown.filter((t) => t.total > 0) as t (t.id)}
        <div class="trow">
          <div class="tinfo"><span>{t.name}</span><span class="text-xs muted">{t.completed}/{t.total}</span></div>
          <ProgressBar value={t.rate} height={6} />
        </div>
      {/each}
    </div>
  {/if}
{/if}

<style>
  .ph { padding: 8px 2px 16px; }
  .ph h1 { font-size: var(--fs-display); }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 6px; }
  .insights { display: grid; gap: 8px; }
  .ins { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: var(--r-md); font-size: var(--fs-sm); }
  .ins :global(svg) { color: var(--accent); flex-shrink: 0; }
  .heat { padding: 16px; border-radius: var(--r-lg); overflow-x: auto; }
  .heat-grid { display: flex; gap: 3px; min-width: max-content; }
  .hcol { display: flex; flex-direction: column; gap: 3px; }
  .hcell { width: 11px; height: 11px; border-radius: 3px; display: inline-block; }
  .l0 { background: var(--glass-border); }
  .l1 { background: rgba(var(--accent-rgb), 0.32); }
  .l2 { background: rgba(var(--accent-rgb), 0.55); }
  .l3 { background: rgba(var(--accent-rgb), 0.78); }
  .l4 { background: var(--accent); }
  .legend { display: flex; align-items: center; gap: 4px; margin-top: 12px; justify-content: flex-end; }
  .topics { padding: 16px; border-radius: var(--r-lg); display: grid; gap: 14px; }
  .tinfo { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: var(--fs-sm); font-weight: 600; }
  @media (min-width: 1024px) { .grid2 { grid-template-columns: repeat(4, 1fr); } }
</style>
