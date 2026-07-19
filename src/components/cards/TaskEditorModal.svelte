<script>
  import Modal from '../ui/Modal.svelte';
  import Button from '../ui/Button.svelte';
  import SegmentedControl from '../ui/SegmentedControl.svelte';
  import { createTask, updateTask, deleteTask, getTopics } from '../../lib/db.js';
  import { parseFbDate, toDateKey } from '../../lib/utils/dates.js';
  import { cache } from '../../lib/utils/swrCache.js';
  import { toast } from '../../lib/stores/ui.svelte.js';
  import { syncTaskEvent, deleteTaskEvent, getValidToken } from '../../lib/googleCalendar.js';

  let { open = false, task = null, uid, topics = [], onclose = () => {}, onsaved = () => {} } = $props();

  let title = $state('');
  let description = $state('');
  let priority = $state('medium');
  let due = $state('');
  let dueTime = $state('');
  let subjectId = $state('');
  let topicId = $state('');
  let subtopics = $state([]);
  let busy = $state(false);

  $effect(() => {
    if (open) {
      title = task?.title || '';
      description = task?.description || '';
      priority = (task?.priority || 'medium').toLowerCase();
      const d = parseFbDate(task?.dueDate);
      due = d ? toDateKey(d) : (task ? '' : toDateKey(new Date()));
      dueTime = task?.dueTime || '';
      subjectId = task?.subjectId || '';
      topicId = task?.topicId || '';
    }
  });

  // Load subtopics when a topic (subject) is chosen
  $effect(() => {
    if (subjectId && uid) getTopics(uid, subjectId).then((t) => (subtopics = t || []));
    else subtopics = [];
  });

  async function save() {
    if (!title.trim()) return toast('Give your task a title', 'warning');
    busy = true;
    const payload = {
      title, description, priority, dueDate: due || null, dueTime: due ? dueTime || null : null,
      subjectId: subjectId || null, topicId: topicId || null,
    };
    try {
      const taskId = task ? task.id : (await createTask(uid, payload))?.id;
      if (task) await updateTask(task.id, payload);
      cache.invalidatePrefix('tasks_');
      if (taskId && due) await syncCalendar(taskId, payload, task?.gcalEventId);
      onsaved();
      onclose();
    } finally { busy = false; }
  }

  async function syncCalendar(taskId, payload, existingEventId) {
    try {
      if (!(await getValidToken())) return; // not connected — skip silently
      const eventId = await syncTaskEvent({
        title: payload.title, description: payload.description,
        dueDateStr: payload.dueDate, dueTime: payload.dueTime, gcalEventId: existingEventId,
      });
      if (eventId && eventId !== existingEventId) await updateTask(taskId, { gcalEventId: eventId });
      else if (!eventId) toast('Task saved, but calendar sync failed', 'warning');
    } catch { toast('Task saved, but calendar sync failed', 'warning'); }
  }

  async function remove() {
    busy = true;
    try {
      if (task.gcalEventId) deleteTaskEvent(task.gcalEventId);
      await deleteTask(task.id); cache.invalidatePrefix('tasks_'); onsaved(); onclose();
    } finally { busy = false; }
  }
</script>

<Modal {open} {onclose} title={task ? 'Edit task' : 'New task'} maxWidth="460px">
  <div class="field"><label for="t-title">Title</label><input id="t-title" class="input" bind:value={title} placeholder="What needs doing?" /></div>
  <div class="field"><label for="t-desc">Details</label><textarea id="t-desc" class="textarea" bind:value={description} placeholder="Optional notes…" rows="3"></textarea></div>

  <div class="field">
    <label for="t-prio">Priority</label>
    <select id="t-prio" class="select" bind:value={priority}>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
  </div>

  <div class="row">
    <div class="field" style="flex:1"><label for="t-due">Due date</label><input id="t-due" class="input" type="date" bind:value={due} /></div>
    {#if due}
      <div class="field" style="flex:1"><label for="t-due-time">Due time</label><input id="t-due-time" class="input" type="time" bind:value={dueTime} /></div>
    {/if}
  </div>

  <div class="field">
    <label for="t-topic">Topic</label>
    <select id="t-topic" class="select" bind:value={subjectId}>
      <option value="">None</option>
      {#each topics as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
    </select>
  </div>

  {#if subtopics.length}
    <div class="field">
      <label for="t-sub">Subtopic</label>
      <select id="t-sub" class="select" bind:value={topicId}>
        <option value="">None</option>
        {#each subtopics as s (s.id)}<option value={s.id}>{s.name}</option>{/each}
      </select>
    </div>
  {/if}

  <div class="actions">
    {#if task}<Button variant="danger" onclick={remove} icon="trash-2">Delete</Button>{/if}
    <div class="grow"></div>
    <Button variant="glass" onclick={onclose}>Cancel</Button>
    <Button variant="primary" loading={busy} onclick={save}>{task ? 'Save' : 'Create'}</Button>
  </div>
</Modal>

<style>
  .row { display: flex; gap: 12px; }
  .actions { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
</style>
