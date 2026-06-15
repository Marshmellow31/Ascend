<script>
  import { ui } from '../../lib/stores/ui.svelte.js';
  import { authStore } from '../../lib/stores/auth.svelte.js';
  import { createTask, createNote } from '../../lib/db.js';
  import { toast } from '../../lib/stores/ui.svelte.js';
  import { haptic } from '../../lib/utils/feedback.js';
  import { cache } from '../../lib/utils/swrCache.js';
  import { toDateKey } from '../../lib/utils/dates.js';
  import Modal from '../ui/Modal.svelte';
  import Button from '../ui/Button.svelte';
  import SegmentedControl from '../ui/SegmentedControl.svelte';
  import Icon from '../ui/Icon.svelte';

  let mode = $state('task');     // 'task' | 'note'
  let title = $state('');
  let body = $state('');
  let priority = $state('medium');
  let due = $state(toDateKey(new Date()));
  let busy = $state(false);

  function reset() { title = ''; body = ''; priority = 'medium'; due = toDateKey(new Date()); mode = 'task'; }
  function close() { ui.closeQuickCapture(); }

  $effect(() => { if (ui.quickCaptureOpen) { reset(); } });

  async function save() {
    const uid = authStore.uid;
    if (!uid) return;
    if (!title.trim() && mode === 'note' && !body.trim()) return toast('Nothing to save', 'warning');
    if (!title.trim() && mode === 'task') return toast('Give your task a title', 'warning');
    busy = true;
    haptic('tap');
    try {
      if (mode === 'task') {
        await createTask(uid, { title, description: body, priority, dueDate: due || null });
        cache.invalidatePrefix('tasks_');
        toast('Task added', 'success');
      } else {
        await createNote(uid, { title, content: body, color: 'var(--accent)' });
        cache.invalidatePrefix('notes_');
        toast('Note saved', 'success');
      }
      window.dispatchEvent(new CustomEvent('data-changed', { detail: { kind: mode } }));
      close();
    } catch { /* db layer toasts */ }
    finally { busy = false; }
  }
</script>

<Modal open={ui.quickCaptureOpen} onclose={close} title="Quick add" maxWidth="440px">
  <SegmentedControl
    options={[{ value: 'task', label: 'Task' }, { value: 'note', label: 'Note' }]}
    value={mode}
    onchange={(v) => (mode = v)}
  />

  <div class="field" style="margin-top:16px">
    <label for="qc-title">{mode === 'task' ? 'Task' : 'Title'}</label>
    <input id="qc-title" class="input" bind:value={title} placeholder={mode === 'task' ? 'What needs doing?' : 'Note title (optional)'} />
  </div>

  <div class="field">
    <label for="qc-body">{mode === 'task' ? 'Details (optional)' : 'Note'}</label>
    <textarea id="qc-body" class="textarea" bind:value={body} placeholder={mode === 'task' ? 'Add details…' : 'Start writing…'}></textarea>
  </div>

  {#if mode === 'task'}
    <div class="row">
      <div class="field" style="flex:1">
        <label for="qc-prio">Priority</label>
        <select id="qc-prio" class="select" bind:value={priority}>
          <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
      </div>
      <div class="field" style="flex:1">
        <label for="qc-due">Due date</label>
        <input id="qc-due" class="input" type="date" bind:value={due} />
      </div>
    </div>
  {/if}

  <div style="display:flex; gap:10px; margin-top:8px">
    <Button variant="glass" full onclick={close}>Cancel</Button>
    <Button variant="primary" full loading={busy} onclick={save} icon="plus">Add {mode}</Button>
  </div>
</Modal>

<style>
  .row { display: flex; gap: 12px; }
</style>
