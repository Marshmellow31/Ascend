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

  // Last 7 days → weekly bar chart (today = accent bar)
  const DAY_LBL = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weekBars = $derived.by(() => {
    if (!a?.heatmapData?.length) return [];
    const last7 = a.heatmapData.slice(-7);
    const max = Math.max(1, ...last7.map((d) => d.count));
    return last7.map((d, i) => ({
      n: d.count,
      h: Math.round((d.count / max) * 100),
      day: DAY_LBL[new Date(d.date + 'T00:00:00').getDay()],
      today: i === last7.length - 1,
    }));
  });
  const weekTotal = $derived(weekBars.reduce((s, b) => s + b.n, 0));
  const TOPIC_COLORS = ['var(--hue-violet)', 'var(--accent)', 'var(--hue-green)', 'var(--hue-red)', 'var(--hue-amber)'];
</script>

<header class="ph fade-up"><h1>Analytics</h1></header>

{#if loading}
  <div class="grid2"><Skeleton height="110px" /><Skeleton height="110px" /><Skeleton height="110px" /><Skeleton height="110px" /></div>
  <Skeleton height="200px" />
{:else}
  <div style="margin-bottom: 14px;"><XpBar /></div>
  <div class="grid2">
    <StatCard value={a.completed} label="Tasks / week" icon="check-check" iconColor="var(--hue-green)" delta={`${a.completionRate}% completion`} deltaPositive />
    <StatCard value={focusH > 0 ? `${focusH}h ${focusM}m` : `${focusM}m`} label="Focus time" icon="timer" iconColor="var(--hue-violet)" animate={false} delta={`${focus.focusSessions} sessions`} />
    <StatCard value={a.streak} label="Consistency" unit="day streak" icon="flame" iconColor="var(--accent)" />
  </div>

  {#if weekBars.length}
    <div class="panel">
      <div class="panel-head">
        <div class="panel-title">Tasks completed — this week</div>
        <div class="panel-total">{weekTotal} total</div>
      </div>
      <div class="bars">
        {#each weekBars as b}
          <div class="barcol">
            <div class="barnum" class:on={b.today}>{b.n}</div>
            <div class="bar" class:on={b.today} style="height:{Math.max(4, b.h)}%"></div>
            <div class="barday">{b.day}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if a.insights?.length}
    <div class="section-head"><h2>Key insights</h2></div>
    <div class="insights">
      {#each a.insights as ins (ins)}
        <div class="ins"><Icon name="sparkles" size={15} /><span>{ins}</span></div>
      {/each}
    </div>
  {/if}

  <div class="section-head"><h2>Consistency</h2><span class="microlabel">last 24 weeks</span></div>
  <div class="heat">
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
    <div class="topics">
      {#each a.topicBreakdown.filter((t) => t.total > 0) as t, i (t.id)}
        <div class="trow">
          <div class="tinfo"><span>{t.name}</span><span class="tcount">{t.completed}/{t.total}</span></div>
          <ProgressBar value={t.rate} height={8} gradient={false} color={TOPIC_COLORS[i % TOPIC_COLORS.length]} track="var(--track)" />
        </div>
      {/each}
    </div>
  {/if}
{/if}

<style>
  .ph { padding: 8px 0 20px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }

  .panel { border-radius: 24px; background: var(--bg-1); border: 1px solid var(--border); padding: 24px; margin-bottom: 14px; }
  .panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
  .panel-title { font-size: 15px; font-weight: 900; letter-spacing: -0.3px; }
  .panel-total { font-size: 12px; font-weight: 700; color: var(--accent); }
  .bars { display: flex; align-items: flex-end; gap: 12px; height: 160px; }
  .barcol { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; justify-content: flex-end; }
  .barnum { font-size: 12px; font-weight: 800; color: var(--text-2); }
  .barnum.on { color: var(--accent); }
  .bar { width: 100%; max-width: 44px; border-radius: 10px; background: var(--bar-inactive); transition: height 0.6s var(--ease); }
  .bar.on { background: var(--accent); }
  .barday { font-size: 11px; font-weight: 800; letter-spacing: 0.5px; color: var(--text-4); }

  .insights { display: grid; gap: 8px; }
  .ins {
    display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: var(--r-md);
    background: var(--bg-1); border: 1px solid var(--border); font-size: var(--fs-sm); font-weight: 600;
  }
  .ins :global(svg) { color: var(--accent); flex-shrink: 0; }

  .heat { padding: 20px; border-radius: 24px; background: var(--bg-1); border: 1px solid var(--border); overflow-x: auto; }
  .heat-grid { display: flex; gap: 3px; min-width: max-content; }
  .hcol { display: flex; flex-direction: column; gap: 3px; }
  .hcell { width: 11px; height: 11px; border-radius: 3px; display: inline-block; }
  .l0 { background: var(--track); }
  .l1 { background: rgba(var(--accent-rgb), 0.32); }
  .l2 { background: rgba(var(--accent-rgb), 0.55); }
  .l3 { background: rgba(var(--accent-rgb), 0.78); }
  .l4 { background: var(--accent); }
  .legend { display: flex; align-items: center; gap: 4px; margin-top: 12px; justify-content: flex-end; font-weight: 600; }

  .topics { padding: 24px; border-radius: 24px; background: var(--bg-1); border: 1px solid var(--border); display: grid; gap: 14px; }
  .tinfo { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; font-weight: 700; }
  .tcount { color: var(--text-2); }
  @media (min-width: 1024px) { .grid2 { grid-template-columns: repeat(3, 1fr); } }
</style>
