<script>
  import { ui } from '../../lib/stores/ui.svelte.js';
  import Modal from './Modal.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';

  const d = $derived(ui.confirmDialog);
</script>

{#if d}
  <Modal open={true} onclose={() => ui.resolveConfirm(false)} maxWidth="380px">
    <div class="confirm">
      <div class="ic" class:danger={d.danger}>
        <Icon name={d.danger ? 'alert-triangle' : 'help-circle'} size={26} />
      </div>
      <h2>{d.title}</h2>
      <p class="text-2 text-sm">{d.message}</p>
      <div class="actions">
        <Button variant="glass" full onclick={() => ui.resolveConfirm(false)}>Cancel</Button>
        <Button variant={d.danger ? 'danger' : 'primary'} full onclick={() => ui.resolveConfirm(true)}>{d.confirmText}</Button>
      </div>
    </div>
  </Modal>
{/if}

<style>
  .confirm { text-align: center; padding: 8px 4px 4px; }
  .ic { width: 56px; height: 56px; margin: 0 auto 14px; display: grid; place-items: center; border-radius: var(--r-full); background: rgba(var(--accent-rgb), 0.14); color: var(--accent); }
  .ic.danger { background: rgba(251, 113, 133, 0.16); color: var(--danger); }
  .confirm h2 { margin-bottom: 6px; }
  .confirm p { margin-bottom: 20px; }
  .actions { display: flex; gap: 10px; }
</style>
