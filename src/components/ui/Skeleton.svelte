<script>
  let { height = '20px', width = '100%', radius = 'var(--r-md)', class: klass = '' } = $props();
</script>

<div class="skeleton {klass}" style="height:{height};width:{width};border-radius:{radius}"></div>
