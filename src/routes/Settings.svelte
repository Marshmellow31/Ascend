<script>
  import { authStore } from '../lib/stores/auth.svelte.js';
  import { theme, ACCENTS } from '../lib/stores/theme.svelte.js';
  import { updateUserProfile } from '../lib/db.js';
  import { logOut } from '../lib/auth.js';
  import { toast } from '../lib/stores/ui.svelte.js';
  import { haptic } from '../lib/utils/feedback.js';

  import SegmentedControl from '../components/ui/SegmentedControl.svelte';
  import Button from '../components/ui/Button.svelte';
  import Icon from '../components/ui/Icon.svelte';

  const uid = authStore.uid;
  const profile = $derived(authStore.profile);

  let name = $state(authStore.profile?.displayName || '');
  let weekStart = $state(authStore.profile?.weekStartDay || 'monday');
  let btechName = $state(authStore.profile?.btechName || '');
  let btechStart = $state(authStore.profile?.btechStart || '');
  let btechEnd = $state(authStore.profile?.btechEnd || '');
  let studyGoals = $state(authStore.profile?.studyGoals || '');
  let savingProfile = $state(false);

  function persistTheme() {
    updateUserProfile(uid, { theme: theme.mode, prefs: theme.toPrefs() });
  }
  function setMode(m) { theme.setMode(m); persistTheme(); }
  function setAccent(a) { theme.setAccent(a); haptic('tap'); persistTheme(); }
  function setGlass(on) { theme.setGlass(on); persistTheme(); }
  function setFx(key, val) { theme.setFx({ [key]: val }); if (val) haptic('tap'); persistTheme(); }

  async function saveProfile() {
    savingProfile = true;
    try {
      await updateUserProfile(uid, { displayName: name, weekStartDay: weekStart, btechName, btechStart, btechEnd, studyGoals });
      authStore.setProfile({ ...profile, displayName: name, weekStartDay: weekStart, btechName, btechStart, btechEnd, studyGoals });
      toast('Profile saved', 'success');
    } finally { savingProfile = false; }
  }
</script>

<header class="ph"><h1>Settings</h1></header>

<!-- Appearance -->
<section class="card glass">
  <h2 class="s-title"><Icon name="palette" size={17} /> Appearance</h2>

  <div class="opt"><span>Theme</span>
    <SegmentedControl size="sm" options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} value={theme.mode} onchange={setMode} />
  </div>

  <div class="opt col">
    <span>Accent</span>
    <div class="accents">
      {#each ACCENTS as ac (ac.id)}
        <button class="acc" class:active={theme.accent === ac.id} style="background:linear-gradient(135deg,{ac.from},{ac.to})" onclick={() => setAccent(ac.id)} aria-label={ac.label}>
          {#if theme.accent === ac.id}<Icon name="check" size={15} stroke={3} />{/if}
        </button>
      {/each}
    </div>
  </div>

  <label class="toggle"><span>Glass blur effects</span><input type="checkbox" checked={theme.glass === 'on'} onchange={(e) => setGlass(e.target.checked)} /></label>
</section>

<!-- Feedback -->
<section class="card glass">
  <h2 class="s-title"><Icon name="sparkles" size={17} /> Feedback &amp; rewards</h2>
  <label class="toggle"><span><Icon name="vibrate" size={15} /> Haptics</span><input type="checkbox" checked={theme.fx.haptics} onchange={(e) => setFx('haptics', e.target.checked)} /></label>
  <label class="toggle"><span><Icon name="volume-2" size={15} /> Sound effects</span><input type="checkbox" checked={theme.fx.sound} onchange={(e) => setFx('sound', e.target.checked)} /></label>
  <label class="toggle"><span><Icon name="party-popper" size={15} /> Confetti celebrations</span><input type="checkbox" checked={theme.fx.confetti} onchange={(e) => setFx('confetti', e.target.checked)} /></label>
</section>

<!-- Profile -->
<section class="card glass">
  <h2 class="s-title"><Icon name="user" size={17} /> Profile</h2>
  <div class="field"><label for="s-name">Display name</label><input id="s-name" class="input" bind:value={name} /></div>
  <div class="field"><label>Week starts on</label>
    <SegmentedControl size="sm" options={[{ value: 'monday', label: 'Monday' }, { value: 'sunday', label: 'Sunday' }]} value={weekStart} onchange={(v) => (weekStart = v)} />
  </div>
  <div class="field"><label for="s-study">Study goals / notes</label><textarea id="s-study" class="textarea" bind:value={studyGoals} rows="3" placeholder="What are you working towards?"></textarea></div>
</section>

<!-- Long-term focus -->
<section class="card glass">
  <h2 class="s-title"><Icon name="target" size={17} /> Long-term focus</h2>
  <div class="field"><label for="bt-name">Title</label><input id="bt-name" class="input" bind:value={btechName} placeholder="e.g. B.Tech, GATE prep" /></div>
  <div class="row">
    <div class="field" style="flex:1"><label for="bt-s">Start</label><input id="bt-s" class="input" type="date" bind:value={btechStart} /></div>
    <div class="field" style="flex:1"><label for="bt-e">End</label><input id="bt-e" class="input" type="date" bind:value={btechEnd} /></div>
  </div>
</section>

<Button variant="primary" full loading={savingProfile} onclick={saveProfile}>Save profile</Button>
<Button variant="glass" full icon="log-out" onclick={() => logOut()} class="so">Sign out</Button>

<style>
  .ph { padding: 8px 2px 16px; }
  .ph h1 { font-size: var(--fs-display); }
  .card { padding: 18px; border-radius: var(--r-lg); margin-bottom: 14px; }
  .s-title { display: flex; align-items: center; gap: 8px; font-size: 15px; margin-bottom: 16px; color: var(--text-2); }
  .s-title :global(svg) { color: var(--accent); }
  .opt { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
  .opt.col { flex-direction: column; align-items: flex-start; gap: 10px; }
  .opt > span { font-weight: 600; font-size: var(--fs-sm); }
  .accents { display: flex; gap: 10px; flex-wrap: wrap; }
  .acc { width: 38px; height: 38px; border-radius: var(--r-full); display: grid; place-items: center; color: #fff; border: 2px solid transparent; transition: transform var(--t-fast); }
  .acc.active { border-color: var(--text); transform: scale(1.1); }
  .toggle { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; font-weight: 600; font-size: var(--fs-sm); cursor: pointer; }
  .toggle span { display: inline-flex; align-items: center; gap: 8px; }
  .toggle input { width: 44px; height: 26px; appearance: none; background: var(--glass-border); border-radius: 999px; position: relative; cursor: pointer; transition: background var(--t-fast); flex-shrink: 0; }
  .toggle input:checked { background: var(--accent); }
  .toggle input::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform var(--t-fast) var(--ease-spring); }
  .toggle input:checked::after { transform: translateX(18px); }
  .row { display: flex; gap: 12px; }
  :global(.so) { margin-top: 10px; }
</style>
