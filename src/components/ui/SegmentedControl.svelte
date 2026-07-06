<script>
  // options: [{ value, label }]  ·  value: bound current value  ·  onchange(value)
  // Restyled as pill filter chips (active = accent bg, near-black text).
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
  .seg { display: inline-flex; gap: 8px; flex-wrap: wrap; }
  .seg-btn {
    padding: 9px 18px; border-radius: var(--r-full); font-size: 13px; font-weight: 800;
    border: 1px solid var(--border-strong); background: transparent; color: var(--text-nav);
    white-space: nowrap; transition: all var(--t-fast);
  }
  .seg-sm .seg-btn { padding: 8px 15px; font-size: 12.5px; }
  .seg-btn:active { transform: scale(0.96); }
  .seg-btn.active { background: var(--accent); color: var(--text-on-accent); border-color: var(--accent); }
</style>
