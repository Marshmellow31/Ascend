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
  function setAccent(a) { theme.setAccent(a); haptic('tap'); persistTheme(); }
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

<!-- Accent color -->
<section class="card glass">
  <div class="microlabel s-label">Accent color</div>
  <div class="accents">
    {#each ACCENTS as ac (ac.id)}
      <button class="acc" class:active={theme.accent === ac.id} style="background:{ac.from}" onclick={() => setAccent(ac.id)} aria-label={ac.label}></button>
    {/each}
  </div>
</section>

<!-- Feedback -->
<section class="card glass rows">
  <label class="toggle">
    <Icon name="vibrate" size={19} />
    <span class="t-text"><span class="t-label">Haptics</span><span class="t-sub">Vibrate on task complete</span></span>
    <input type="checkbox" checked={theme.fx.haptics} onchange={(e) => setFx('haptics', e.target.checked)} />
  </label>
  <label class="toggle">
    <Icon name="volume-2" size={19} />
    <span class="t-text"><span class="t-label">Sounds</span><span class="t-sub">Level-up &amp; timer chimes</span></span>
    <input type="checkbox" checked={theme.fx.sound} onchange={(e) => setFx('sound', e.target.checked)} />
  </label>
  <label class="toggle">
    <Icon name="party-popper" size={19} />
    <span class="t-text"><span class="t-label">Confetti</span><span class="t-sub">Celebrate goals &amp; achievements</span></span>
    <input type="checkbox" checked={theme.fx.confetti} onchange={(e) => setFx('confetti', e.target.checked)} />
  </label>
</section>

<!-- Profile -->
<section class="card glass">
  <div class="microlabel s-label">Profile</div>
  <div class="field"><label for="s-name">Display name</label><input id="s-name" class="input" bind:value={name} /></div>
  <div class="field"><label>Week starts on</label>
    <SegmentedControl size="sm" options={[{ value: 'monday', label: 'Monday' }, { value: 'sunday', label: 'Sunday' }]} value={weekStart} onchange={(v) => (weekStart = v)} />
  </div>
  <div class="field"><label for="s-study">Study goals / notes</label><textarea id="s-study" class="textarea" bind:value={studyGoals} rows="3" placeholder="What are you working towards?"></textarea></div>
</section>

<!-- Long-term focus -->
<section class="card glass">
  <div class="microlabel s-label">Long-term focus</div>
  <div class="field"><label for="bt-name">Title</label><input id="bt-name" class="input" bind:value={btechName} placeholder="e.g. B.Tech, GATE prep" /></div>
  <div class="row">
    <div class="field" style="flex:1"><label for="bt-s">Start</label><input id="bt-s" class="input" type="date" bind:value={btechStart} /></div>
    <div class="field" style="flex:1"><label for="bt-e">End</label><input id="bt-e" class="input" type="date" bind:value={btechEnd} /></div>
  </div>
</section>

<Button variant="primary" full loading={savingProfile} onclick={saveProfile}>Save profile</Button>
<Button variant="danger" full icon="log-out" onclick={() => logOut()} class="so">Sign out</Button>

<style>
  .ph { padding: 8px 0 20px; }
  .card { padding: 20px 22px; border-radius: var(--r-lg); margin-bottom: 14px; max-width: 640px; }
  .s-label { margin-bottom: 16px; }
  .accents { display: flex; gap: 12px; flex-wrap: wrap; }
  .acc {
    width: 44px; height: 44px; border-radius: 50%; border: 3px solid transparent;
    cursor: pointer; transition: transform var(--t-fast);
  }
  .acc:hover { transform: scale(1.12); }
  .acc.active { border-color: var(--text); }
  .card.rows { padding: 0 22px; }
  .toggle {
    display: flex; align-items: center; gap: 14px; padding: 17px 0; cursor: pointer;
    border-bottom: 1px solid var(--divider); color: var(--text-2);
  }
  .toggle:last-child { border-bottom: none; }
  .t-text { flex: 1; display: flex; flex-direction: column; }
  .t-label { font-size: 14.5px; font-weight: 700; color: var(--text); }
  .t-sub { font-size: 12px; color: var(--text-3); font-weight: 600; }
  .toggle input {
    width: 50px; height: 29px; appearance: none; -webkit-appearance: none; background: var(--bar-inactive);
    border-radius: 999px; position: relative; cursor: pointer; transition: background 0.2s; flex-shrink: 0;
  }
  .toggle input:checked { background: var(--accent); }
  .toggle input::after {
    content: ''; position: absolute; top: 3px; left: 3px; width: 23px; height: 23px;
    border-radius: 50%; background: var(--text); transition: transform 0.2s var(--ease);
  }
  .toggle input:checked::after { transform: translateX(21px); }
  .row { display: flex; gap: 12px; }
  :global(.so) { margin-top: 10px; }
  :global(.settings-save) { max-width: 640px; }
</style>
