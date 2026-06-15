<script>
  import Icon from './Icon.svelte';

  let {
    variant = 'primary', size = 'md', icon = null, iconRight = null,
    loading = false, type = 'button', disabled = false, full = false,
    class: klass = '', onclick = null, children, ...rest
  } = $props();

  const sizeCls = $derived(size === 'sm' ? 'btn-sm' : '');
  const iconSize = $derived(size === 'sm' ? 15 : 18);
</script>

<button
  {type}
  class="btn btn-{variant} {sizeCls} {full ? 'btn-full' : ''} {klass}"
  disabled={disabled || loading}
  {onclick}
  {...rest}
>
  {#if loading}
    <span class="spinner" style="width:16px;height:16px"></span>
  {:else}
    {#if icon}<Icon name={icon} size={iconSize} />{/if}
    {@render children?.()}
    {#if iconRight}<Icon name={iconRight} size={iconSize} />{/if}
  {/if}
</button>
