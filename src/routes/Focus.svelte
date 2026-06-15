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

<div class="focus">
  <div class="f-head">
    <SegmentedControl
      options={[{ value: 'work', label: 'Focus' }, { value: 'short', label: 'Break' }, { value: 'long', label: 'Long' }]}
      value={mode} onchange={(v) => { if (!running) mode = v; }}
    />
  </div>

  <div class="label">{mode === 'work' ? label : (mode === 'short' ? 'Short break' : 'Long break')}</div>

  <div class="ringwrap">
    <Ring value={pct} size={260} stroke={14} animate={false}>
      <span class="clock">{formatClock(remainingMs)}</span>
      <span class="cyc text-xs muted">{cyclesDone} session{cyclesDone === 1 ? '' : 's'} today</span>
    </Ring>
  </div>

  {#if mode === 'work' && !running && remainingMs === total}
    <div class="lens">
      {#each [15, 25, 50] as L (L)}
        <button class="lenbtn" class:active={workLen === L} onclick={() => (workLen = L)}>{L}m</button>
      {/each}
    </div>
  {/if}

  <div class="controls">
    <button class="ctl ghost" onclick={reset} aria-label="Reset"><Icon name="rotate-ccw" size={20} /></button>
    {#if running}
      <button class="ctl main" onclick={pause} aria-label="Pause"><Icon name="pause" size={26} /></button>
    {:else}
      <button class="ctl main" onclick={start} aria-label="Start"><Icon name="play" size={26} /></button>
    {/if}
    <button class="ctl ghost" onclick={finish} aria-label="Skip" title="Skip"><Icon name="check-check" size={20} /></button>
  </div>

  <p class="hint text-xs muted center">Focus sessions earn XP and feed your streak.</p>
</div>

<style>
  .focus { display: flex; flex-direction: column; align-items: center; gap: 22px; padding: 14px 0 30px; }
  .f-head { width: 100%; max-width: 320px; display: flex; justify-content: center; }
  .f-head :global(.seg) { width: 100%; }
  .label { font-weight: 700; font-size: 18px; }
  .ringwrap { margin: 6px 0; }
  .clock { font-size: 46px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
  .cyc { margin-top: 6px; }
  .lens { display: flex; gap: 8px; }
  .lenbtn { padding: 7px 16px; border-radius: var(--r-full); background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-2); font-weight: 650; font-size: var(--fs-sm); }
  .lenbtn.active { background: linear-gradient(120deg, var(--accent), var(--accent-2)); color: var(--text-on-accent); border-color: transparent; }
  .controls { display: flex; align-items: center; gap: 18px; }
  .ctl { width: 56px; height: 56px; border-radius: var(--r-full); display: grid; place-items: center; color: var(--text-2); background: var(--glass-bg); border: 1px solid var(--glass-border); }
  .ctl.main { width: 76px; height: 76px; color: var(--text-on-accent); background: linear-gradient(135deg, var(--accent), var(--accent-2)); border: none; box-shadow: 0 10px 30px rgba(var(--accent-rgb), 0.45); }
  .ctl:active { transform: scale(0.94); }
</style>
