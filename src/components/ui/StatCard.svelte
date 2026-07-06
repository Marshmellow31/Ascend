<script>
  import AnimatedNumber from './AnimatedNumber.svelte';
  import Icon from './Icon.svelte';

  let {
    value = 0, label = '', suffix = '', unit = '', icon = null, iconColor = 'var(--accent)',
    delta = '', deltaPositive = false, danger = false, animate = true,
  } = $props();
  const isNum = $derived(typeof value === 'number');
</script>

<div class="stat">
  <div class="head" style="color:{iconColor}">
    {#if icon}<Icon name={icon} size={17} stroke={2.5} />{/if}
    <span class="microlabel">{label}</span>
  </div>
  <div class="v" class:danger>
    {#if isNum && animate}<AnimatedNumber {value} {suffix} />{:else}{value}{suffix}{/if}
    {#if unit}<span class="unit">{unit}</span>{/if}
  </div>
  {#if delta}<div class="delta" class:pos={deltaPositive}>{delta}</div>{/if}
</div>

<style>
  .stat {
    padding: 18px 20px; border-radius: 20px; background: var(--bg-1); border: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 8px;
  }
  .head { display: flex; align-items: center; gap: 8px; }
  .v { font-size: 30px; font-weight: 900; letter-spacing: -1px; line-height: 1; }
  .v.danger { color: var(--danger); }
  .unit { font-size: 14px; font-weight: 700; color: var(--text-4); margin-left: 3px; }
  .delta { font-size: 12px; font-weight: 600; color: var(--text-2); }
  .delta.pos { color: var(--success); }
</style>
