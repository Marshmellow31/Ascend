<script>
  import Icon from '../ui/Icon.svelte';
  import { parseFbDate, formatDate } from '../../lib/utils/dates.js';
  import { taskXp } from '../../lib/logic/gamificationEngine.js';

  let { task, oncomplete = () => {}, onopen = null, compact = false } = $props();

  const due = $derived(parseFbDate(task.dueDate));
  const overdue = $derived(due && due < new Date() && !task.isCompleted);
  const prio = $derived((task.priority || 'medium').toLowerCase());
  const xp = $derived(taskXp(task.priority));
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
  class="tcard"
  class:done={task.isCompleted}
  class:clickable={onopen}
  onclick={() => onopen?.(task)}
  role={onopen ? 'button' : undefined}
  tabindex={onopen ? 0 : undefined}
  onkeydown={(e) => { if (onopen && (e.key === 'Enter')) onopen(task); }}
>
  <button class="check" class:on={task.isCompleted || checking} onclick={complete} aria-label="Complete task">
    {#if task.isCompleted || checking}<Icon name="check" size={15} stroke={3.5} />{/if}
  </button>
  <div class="body">
    <div class="title">{task.title}</div>
    {#if !compact}
      <div class="meta">
        <span class="due" class:overdue>{due ? formatDate(due) : 'No date'}{overdue ? ' · overdue' : ''}</span>
      </div>
    {/if}
  </div>
  <span class="tag tag-{prio}">{prio}</span>
  <span class="xp">+{xp} XP</span>
</div>

<style>
  .tcard {
    display: flex; align-items: center; gap: 14px; padding: 16px 18px;
    border-radius: 16px; background: var(--bg-1); border: 1px solid var(--border);
    transition: border-color var(--t-fast);
  }
  .tcard:hover { border-color: var(--border-hover); }
  .clickable { cursor: pointer; }
  .clickable:active { opacity: 0.75; }
  .check {
    flex-shrink: 0; width: 26px; height: 26px; border-radius: 9px;
    border: 2px solid #3A3A44; background: transparent; color: var(--text-on-accent);
    display: flex; align-items: center; justify-content: center;
    transition: all var(--t-fast);
  }
  .check.on { border-color: var(--accent); background: var(--accent); }
  .body { flex: 1; min-width: 0; }
  .title { font-weight: 700; font-size: 15px; line-height: 1.3; }
  .done .title { text-decoration: line-through; color: var(--text-4); }
  .meta { font-size: 12.5px; color: var(--text-3); font-weight: 600; margin-top: 2px; }
  .due.overdue { color: var(--danger); }
  .tag {
    flex-shrink: 0; padding: 5px 12px; border-radius: var(--r-full);
    font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;
  }
  .tag-high { background: var(--hue-red-bg); color: var(--hue-red); }
  .tag-medium { background: var(--hue-amber-bg); color: var(--hue-amber); }
  .tag-low { background: rgba(61, 220, 255, 0.12); color: var(--low); }
  .xp { flex-shrink: 0; color: var(--accent); font-size: 12.5px; font-weight: 800; }
  @media (max-width: 480px) {
    .tag { display: none; }
  }
</style>
