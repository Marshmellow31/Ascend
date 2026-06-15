<script>
  import Icon from '../ui/Icon.svelte';
  let { count = 0, size = 'md' } = $props();
  const lit = $derived(count > 0);
</script>

<div class="flame {size}" class:lit title="{count}-day streak">
  <Icon name="flame" size={size === 'lg' ? 28 : 18} />
  <span class="n">{count}</span>
</div>

<style>
  .flame { display: inline-flex; align-items: center; gap: 5px; color: var(--text-3); font-weight: 800; }
  .flame.lit { color: #FF9F0A; }
  .flame.lg { font-size: 22px; }
</style>
