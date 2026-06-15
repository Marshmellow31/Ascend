<script>
  import { icons } from '../../lib/icons.js';

  let { name, size = 20, stroke = 2, class: klass = '', color = 'currentColor', ...rest } = $props();
  const Cmp = $derived(icons[name] || icons.circle);
</script>

{#if Cmp}
  <Cmp {size} strokeWidth={stroke} {color} class={klass} {...rest} />
{/if}
