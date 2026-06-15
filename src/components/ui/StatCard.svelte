<script>
  import AnimatedNumber from './AnimatedNumber.svelte';
  import Icon from './Icon.svelte';

  let { value = 0, label = '', suffix = '', icon = null, danger = false, animate = true } = $props();
  const isNum = $derived(typeof value === 'number');
</script>

<div class="stat glass">
  <div class="v" class:danger>
    {#if isNum && animate}<AnimatedNumber {value} {suffix} />{:else}{value}{suffix}{/if}
  </div>
  <div class="l text-xs muted">
    {label}{#if icon}<Icon name={icon} size={12} />{/if}
  </div>
</div>

<style>
  .stat { padding: 14px 12px; border-radius: var(--r-md); text-align: center; }
  .v { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
  .v.danger { color: var(--danger); }
  .l { display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; }
</style>
