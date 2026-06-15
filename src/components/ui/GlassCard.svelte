<script>
  let {
    strong = false, interactive = false, padding = '16px', radius = '',
    glow = false, class: klass = '', style = '', onclick = null, children, ...rest
  } = $props();

  const tag = $derived(onclick ? 'button' : 'div');
</script>

<svelte:element
  this={tag}
  class="glass {strong ? 'glass-strong' : ''} {interactive || onclick ? 'glass-int' : ''} {glow ? 'glass-glow' : ''} {klass}"
  style="padding:{padding};{radius ? `border-radius:${radius};` : ''}{style}"
  {onclick}
  {...rest}
>
  {@render children?.()}
</svelte:element>

<style>
  .glass-int {
    text-align: left; width: 100%; color: inherit; font: inherit; display: block;
    cursor: pointer; transition: transform var(--t-fast) var(--ease), border-color var(--t-fast), background var(--t-fast);
  }
  .glass-int:hover { border-color: rgba(var(--accent-rgb), 0.35); }
  .glass-int:active { transform: scale(0.985); }
  .glass-glow { box-shadow: var(--glass-shadow), 0 0 0 1px rgba(var(--accent-rgb), 0.25), 0 8px 40px rgba(var(--accent-rgb), 0.18); }
</style>
