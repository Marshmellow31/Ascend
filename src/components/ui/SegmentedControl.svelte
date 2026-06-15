<script>
  // options: [{ value, label }]  ·  value: bound current value  ·  onchange(value)
  let { options = [], value = '', onchange = () => {}, size = 'md' } = $props();
</script>

<div class="seg {size === 'sm' ? 'seg-sm' : ''}" role="tablist">
  {#each options as opt (opt.value)}
    <button
      role="tab"
      aria-selected={value === opt.value}
      class="seg-btn"
      class:active={value === opt.value}
      onclick={() => onchange(opt.value)}
    >
      {opt.label}
    </button>
  {/each}
</div>

<style>
  .seg {
    display: inline-flex; padding: 2px; gap: 2px; border-radius: var(--r-md);
    background: var(--fill-secondary); border: none; width: 100%;
  }
  .seg-btn {
    flex: 1; padding: 8px 16px; border-radius: calc(var(--r-md) - 2px); font-size: var(--fs-sm);
    font-weight: 600; color: var(--text-2); white-space: nowrap;
    transition: color var(--t-fast), background var(--t-fast), transform var(--t-fast);
  }
  .seg-sm .seg-btn { padding: 6px 12px; font-size: 13px; font-weight: 500; }
  .seg-btn:active { transform: scale(0.96); }
  .seg-btn.active { color: var(--text); background: var(--glass-bg-strong); box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
</style>
