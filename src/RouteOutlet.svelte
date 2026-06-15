<script>
  import { fly } from 'svelte/transition';
  import { router } from './lib/router.svelte.js';

  const loaders = {
    dashboard: () => import('./routes/Dashboard.svelte'),
    tasks: () => import('./routes/Tasks.svelte'),
    calendar: () => import('./routes/Calendar.svelte'),
    focus: () => import('./routes/Focus.svelte'),
    analytics: () => import('./routes/Analytics.svelte'),
    profile: () => import('./routes/Profile.svelte'),
    settings: () => import('./routes/Settings.svelte'),
    subtopics: () => import('./routes/Subtopics.svelte'),
  };

  let Comp = $state(null);
  let routeKey = $state('');

  $effect(() => {
    const path = router.path;
    const loader = loaders[path] || loaders.dashboard;
    loader()
      .then((m) => { Comp = m.default; routeKey = path; })
      .catch((err) => console.error('[router] failed to load', path, err));
  });

  // Idle-preload the primary routes after first paint
  if (typeof window !== 'undefined') {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
    idle(() => { ['tasks', 'focus', 'profile'].forEach((r) => loaders[r]?.()); });
  }
</script>

{#key routeKey}
  <div class="route" in:fly={{ y: 12, duration: 240 }}>
    {#if Comp}
      <Comp params={router.params} />
    {/if}
  </div>
{/key}

<style>
  .route { will-change: transform, opacity; }
</style>
