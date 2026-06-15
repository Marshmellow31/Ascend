<script>
  import Icon from './Icon.svelte';
  let { icon = 'sparkles', title = '', subtitle = '', children } = $props();
</script>

<div class="empty fade-up">
  <div class="empty-icon"><Icon name={icon} size={24} /></div>
  {#if title}<div style="font-weight:700;color:var(--text);margin-bottom:4px">{title}</div>{/if}
  {#if subtitle}<div class="text-sm">{subtitle}</div>{/if}
  {#if children}<div style="margin-top:16px">{@render children()}</div>{/if}
</div>
