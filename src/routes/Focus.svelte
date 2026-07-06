<script>
  import { authStore } from '../lib/stores/auth.svelte.js';
  import { gamification } from '../lib/stores/gamification.svelte.js';
  import { createFocusSession, updateFocusSession, getFocusSessions } from '../lib/db.js';
  import { computeFocusStats } from '../lib/logic/analytics.js';
  import { formatClock } from '../lib/utils/dates.js';
  import { haptic, playSound } from '../lib/utils/feedback.js';
  import { toast } from '../lib/stores/ui.svelte.js';

  import Ring from '../components/ui/Ring.svelte';
  import Icon from '../components/ui/Icon.svelte';
  import Button from '../components/ui/Button.svelte';
  import SegmentedControl from '../components/ui/SegmentedControl.svelte';

  let { params = {} } = $props();
  const uid = authStore.uid;

  const DUR = { work: 25, short: 5, long: 15 }; // minutes
  let workLen = $state(25);
  let mode = $state('work'); // work | short | long
  let running = $state(false);
  let remainingMs = $state(25 * 60000);
  let endAt = 0;
  let cyclesDone = $state(0);
  let label = $state('Deep Work');
  let sessionId = null;

  const total = $derived((mode === 'work' ? workLen : DUR[mode]) * 60000);
  const pct = $derived(total > 0 ? ((total - remainingMs) / total) * 100 : 0);

  // Reset remaining whenever mode/length changes while idle
  $effect(() => { if (!running) remainingMs = total; });

  // Tick
  $effect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      remainingMs = Math.max(0, endAt - Date.now());
      if (remainingMs <= 0) finish();
    }, 200);
    return () => clearInterval(iv);
  });

  async function start() {
    running = true;
    endAt = Date.now() + remainingMs;
    haptic('tap');
    if (mode === 'work' && !sessionId) {
      const ref = await createFocusSession(uid, { label, plannedMs: total, status: 'active' });
      sessionId = ref?.id || null;
    }
  }
  function pause() { running = false; remainingMs = Math.max(0, endAt - Date.now()); }
  function reset() { running = false; remainingMs = total; }

  async function finish() {
    running = false;
    remainingMs = 0;
    playSound(mode === 'work' ? 'complete' : 'ring');
    haptic('success');

    if (mode === 'work') {
      const minutes = Math.round(total / 60000);
      if (sessionId) { await updateFocusSession(sessionId, { status: 'completed', durationMs: total }); sessionId = null; }
      await gamification.awardFocus(minutes);
      const stats = computeFocusStats(await getFocusSessions(uid));
      await gamification.checkAchievements({ focusSessions: stats.focusSessions, focusMinutes: stats.focusMinutes });
      cyclesDone += 1;
      mode = cyclesDone % 4 === 0 ? 'long' : 'short';
      toast('Session complete — take a break', 'success');
    } else {
      mode = 'work';
      toast('Break over — back to it', 'info');
    }
    remainingMs = total;
  }
</script>

<div class="focus fade-up">
  <div class="eyebrow">Focus session</div>
  <h1 class="f-title">{mode === 'work' ? 'Deep work mode' : (mode === 'short' ? 'Short break' : 'Long break')}</h1>

  <div class="f-head">
    <SegmentedControl
      options={[{ value: 'work', label: 'Focus' }, { value: 'short', label: 'Break' }, { value: 'long', label: 'Long' }]}
      value={mode} onchange={(v) => { if (!running) mode = v; }} size="sm"
    />
  </div>

  <div class="ringwrap" class:running>
    <div class="glow"></div>
    <Ring value={pct} size={300} stroke={16} animate={false} trackColor="var(--border)">
      <span class="clock">{formatClock(remainingMs)}</span>
      <span class="cyc">{running ? 'stay in the zone' : remainingMs === total ? 'ready when you are' : 'paused'}</span>
    </Ring>
  </div>

  <div class="controls">
    <button class="ctl ghost" onclick={reset} aria-label="Reset"><Icon name="rotate-ccw" size={20} /></button>
    {#if running}
      <button class="ctl main" onclick={pause} aria-label="Pause"><Icon name="pause" size={28} stroke={2.5} /></button>
    {:else}
      <button class="ctl main" onclick={start} aria-label="Start"><Icon name="play" size={28} stroke={2.5} /></button>
    {/if}
    <button class="ctl ghost" onclick={finish} aria-label="Skip" title="Skip"><Icon name="check-check" size={20} /></button>
  </div>

  {#if mode === 'work' && !running && remainingMs === total}
    <div class="lens">
      {#each [15, 25, 50] as L (L)}
        <button class="lenbtn" class:active={workLen === L} onclick={() => (workLen = L)}>{L} min</button>
      {/each}
    </div>
  {/if}

  <div class="strip">
    <div class="cell"><div class="v">{cyclesDone}</div><div class="l">Sessions today</div></div>
    <div class="div"></div>
    <div class="cell"><div class="v accent">+{cyclesDone * Math.round(workLen)}</div><div class="l">Focus minutes</div></div>
  </div>

  <p class="hint">Focus sessions earn XP and feed your streak.</p>
</div>

<style>
  .focus { display: flex; flex-direction: column; align-items: center; gap: 0; padding: 16px 0 30px; text-align: center; }
  .eyebrow { margin-bottom: 8px; }
  .f-title { margin: 0 0 22px; font-size: 38px; font-weight: 900; letter-spacing: -1.5px; }
  .f-head { margin-bottom: 30px; }

  .ringwrap { position: relative; margin-bottom: 34px; }
  .glow {
    position: absolute; inset: 20px; border-radius: 50%; background: var(--accent-glow);
    filter: blur(50px); opacity: 0.35; transition: opacity 0.5s; pointer-events: none;
  }
  .ringwrap.running .glow { opacity: 1; }
  .clock { font-size: 64px; font-weight: 900; letter-spacing: -2px; font-variant-numeric: tabular-nums; }
  .cyc { font-size: 13px; font-weight: 700; color: var(--text-2); margin-top: 4px; }

  .controls { display: flex; align-items: center; gap: 14px; margin-bottom: 30px; }
  .ctl {
    width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center;
    color: var(--text-2); background: var(--bg-2); border: 1px solid var(--border-strong);
    transition: color var(--t-fast), transform var(--t-fast);
  }
  .ctl.ghost:hover { color: var(--text); }
  .ctl.main {
    width: 76px; height: 76px; color: var(--text-on-accent); background: var(--accent); border: none;
    box-shadow: 0 8px 32px var(--accent-shadow);
  }
  .ctl.main:hover { transform: scale(1.06); }
  .ctl:active { transform: scale(0.94); }

  .lens { display: flex; gap: 8px; margin-bottom: 8px; }
  .lenbtn {
    padding: 10px 20px; border-radius: var(--r-full); background: transparent;
    border: 1px solid var(--border-strong); color: var(--text-nav); font-weight: 800; font-size: 13.5px;
    transition: all var(--t-fast);
  }
  .lenbtn.active { background: var(--accent); color: var(--text-on-accent); border-color: var(--accent); }

  .strip {
    margin-top: 32px; display: flex; gap: 28px; padding: 18px 30px; border-radius: 18px;
    background: var(--bg-1); border: 1px solid var(--border);
  }
  .cell { text-align: center; }
  .cell .v { font-size: 24px; font-weight: 900; }
  .cell .v.accent { color: var(--accent); }
  .cell .l { font-size: 11px; font-weight: 700; color: var(--text-2); letter-spacing: 0.8px; text-transform: uppercase; }
  .div { width: 1px; background: var(--track); }

  .hint { margin-top: 18px; font-size: 12px; color: var(--text-3); font-weight: 600; }
</style>
