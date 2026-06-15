<script>
  import Icon from '../ui/Icon.svelte';
  import { parseFbDate, formatDate } from '../../lib/utils/dates.js';

  let { task, oncomplete = () => {}, onopen = null, compact = false } = $props();

  const due = $derived(parseFbDate(task.dueDate));
  const overdue = $derived(due && due < new Date() && !task.isCompleted);
  const prio = $derived((task.priority || 'medium').toLowerCase());
  let checking = $state(false);

  function complete(e) {
    e.stopPropagation();
    if (task.isCompleted || checking) return;
    checking = true;
    oncomplete(task);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="tcard glass"
  class:done={task.isCompleted}
  class:clickable={onopen}
  onclick={() => onopen?.(task)}
  role={onopen ? 'button' : undefined}
  tabindex={onopen ? 0 : undefined}
  onkeydown={(e) => { if (onopen && (e.key === 'Enter')) onopen(task); }}
>
  <button class="check prio-{prio}" class:on={task.isCompleted || checking} onclick={complete} aria-label="Complete task">
    {#if task.isCompleted || checking}<Icon name="check" size={13} stroke={3.2} />{/if}
  </button>
  <div class="body">
    <div class="title">{task.title}</div>
    {#if !compact}
      <div class="meta">
        <span class="due" class:overdue><Icon name="calendar" size={12} /> {due ? formatDate(due) : 'No date'}</span>
        <span class="sep">·</span>
        <span class="prio prio-{prio}">{prio}</span>
      </div>
    {/if}
  </div>
  {#if onopen}<Icon name="chevron-right" size={16} class="chev" />{/if}
</div>

<style>
  .tcard { display: flex; align-items: center; gap: 13px; padding: 13px 14px; border-radius: var(--r-md); }
  .clickable { cursor: pointer; transition: background var(--t-fast); }
  .clickable:active { background: var(--glass-bg-strong); }
  .check {
    flex-shrink: 0; width: 25px; height: 25px; border-radius: 50%;
    border: 2px solid var(--text-3); display: grid; place-items: center; color: #fff;
    transition: all var(--t-fast) var(--ease-spring); opacity: 0.7;
  }
  .check.on { opacity: 1; border-color: transparent; background: var(--accent); }
  .check.prio-high:not(.on) { border-color: var(--high); opacity: 0.85; }
  .body { flex: 1; min-width: 0; }
  .title { font-weight: 590; font-size: 15px; line-height: 1.3; letter-spacing: -0.01em; }
  .done .title { text-decoration: line-through; color: var(--text-3); }
  .meta { display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: var(--fs-xs); color: var(--text-3); }
  .due { display: inline-flex; align-items: center; gap: 4px; }
  .due.overdue { color: var(--danger); }
  .sep { opacity: 0.5; }
  .prio { text-transform: capitalize; font-weight: 600; }
  .prio-high { color: var(--high); }
  .prio-medium { color: var(--medium); }
  .prio-low { color: var(--low); }
  :global(.tcard .chev) { color: var(--text-3); opacity: 0.5; flex-shrink: 0; }
</style>
