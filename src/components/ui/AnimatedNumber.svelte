<script>
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  let { value = 0, duration = 750, decimals = 0, prefix = '', suffix = '' } = $props();

  const n = new Tween(0, { duration, easing: cubicOut });
  $effect(() => { n.target = Number(value) || 0; });

  const display = $derived(prefix + n.current.toFixed(decimals) + suffix);
</script>

<span>{display}</span>
