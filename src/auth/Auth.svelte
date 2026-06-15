<script>
  import { fly } from 'svelte/transition';
  import { logIn, signUp, logInWithGoogle, resetPassword } from '../lib/auth.js';
  import { friendlyAuthError } from '../lib/utils/dates.js';
  import { isValidEmail } from '../lib/utils/sanitizer.js';
  import { toast } from '../lib/stores/ui.svelte.js';
  import Icon from '../components/ui/Icon.svelte';
  import Button from '../components/ui/Button.svelte';

  let view = $state('landing'); // landing | login | signup | forgot
  let busy = $state(false);
  let form = $state({ name: '', email: '', password: '' });

  function show(v) { view = v; }

  async function doLogin(e) {
    e.preventDefault();
    if (!isValidEmail(form.email)) return toast('Enter a valid email', 'warning');
    busy = true;
    try { await logIn(form.email, form.password); }
    catch (err) { if (err.message !== 'RATE_LIMIT') toast(friendlyAuthError(err.code), 'error'); }
    finally { busy = false; }
  }
  async function doSignup(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast('Enter your name', 'warning');
    if (!isValidEmail(form.email)) return toast('Enter a valid email', 'warning');
    if (form.password.length < 6) return toast('Password needs 6+ characters', 'warning');
    busy = true;
    try { await signUp(form.email, form.password, form.name.trim()); }
    catch (err) { if (err.message !== 'RATE_LIMIT') toast(friendlyAuthError(err.code), 'error'); }
    finally { busy = false; }
  }
  async function doGoogle() {
    busy = true;
    try { await logInWithGoogle(); }
    catch (err) { if (err.message !== 'RATE_LIMIT') toast(friendlyAuthError(err.code), 'error'); }
    finally { busy = false; }
  }
  async function doForgot(e) {
    e.preventDefault();
    if (!isValidEmail(form.email)) return toast('Enter a valid email', 'warning');
    busy = true;
    try { await resetPassword(form.email); toast('Reset link sent — check your inbox', 'success'); show('login'); }
    catch (err) { toast(friendlyAuthError(err.code), 'error'); }
    finally { busy = false; }
  }

  const FEATURES = [
    { icon: 'layout-dashboard', title: 'Plan your day', desc: 'Tasks, schedule & focus in one place' },
    { icon: 'trophy', title: 'Level up', desc: 'Earn XP, streaks & achievements' },
    { icon: 'trending-up', title: 'Grow daily', desc: 'Goals that build into habits' },
    { icon: 'pie-chart', title: 'See progress', desc: 'Heatmaps, streaks & insights' },
  ];
</script>

<div class="auth-wrap">
  {#if view === 'landing'}
    <div class="landing" in:fly={{ y: 16, duration: 320 }}>
      <div class="hero glass glass-strong">
        <div class="logo"><Icon name="sparkles" size={26} /></div>
        <h1 class="title gradient-text">Ascend</h1>
        <p class="tagline text-2">Plan smarter. Grow daily. Stay on top of everything that matters.</p>
        <div class="cta">
          <Button variant="primary" full onclick={() => show('signup')}>Get started free</Button>
          <Button variant="glass" full onclick={() => show('login')}>I already have an account</Button>
        </div>
      </div>

      <div class="features">
        {#each FEATURES as f (f.title)}
          <div class="feature glass">
            <div class="f-ic"><Icon name={f.icon} size={20} /></div>
            <div class="f-title">{f.title}</div>
            <div class="f-desc text-xs muted">{f.desc}</div>
          </div>
        {/each}
      </div>

      <p class="made center text-xs muted">Made by Harshil · Add to your home screen for the full app feel</p>
    </div>

  {:else}
    <div class="card glass glass-strong" in:fly={{ y: 20, duration: 300 }}>
      <button class="back" onclick={() => show(view === 'forgot' ? 'login' : 'landing')} aria-label="Back">
        <Icon name="arrow-left" size={18} />
      </button>

      {#if view === 'login'}
        <h2 class="ct">Welcome back</h2>
        <p class="cs text-2 text-sm">Sign in to continue your ascent</p>
        <form onsubmit={doLogin}>
          <div class="field"><label for="le">Email</label><input id="le" class="input" type="email" autocomplete="email" bind:value={form.email} placeholder="you@example.com" /></div>
          <div class="field"><label for="lp">Password</label><input id="lp" class="input" type="password" autocomplete="current-password" bind:value={form.password} placeholder="••••••••" /></div>
          <Button type="submit" variant="primary" full loading={busy}>Sign in</Button>
        </form>
        <button class="link-btn text-sm" onclick={() => show('forgot')}>Forgot password?</button>

      {:else if view === 'signup'}
        <h2 class="ct">Create account</h2>
        <p class="cs text-2 text-sm">Start your Ascend journey</p>
        <form onsubmit={doSignup}>
          <div class="field"><label for="sn">Name</label><input id="sn" class="input" type="text" autocomplete="name" bind:value={form.name} placeholder="Your name" /></div>
          <div class="field"><label for="se">Email</label><input id="se" class="input" type="email" autocomplete="email" bind:value={form.email} placeholder="you@example.com" /></div>
          <div class="field"><label for="sp">Password</label><input id="sp" class="input" type="password" autocomplete="new-password" bind:value={form.password} placeholder="At least 6 characters" /></div>
          <Button type="submit" variant="primary" full loading={busy}>Create account</Button>
        </form>

      {:else}
        <h2 class="ct">Reset password</h2>
        <p class="cs text-2 text-sm">We'll email you a reset link</p>
        <form onsubmit={doForgot}>
          <div class="field"><label for="fe">Email</label><input id="fe" class="input" type="email" autocomplete="email" bind:value={form.email} placeholder="you@example.com" /></div>
          <Button type="submit" variant="primary" full loading={busy}>Send reset link</Button>
        </form>
      {/if}

      {#if view !== 'forgot'}
        <div class="divider"><span>or</span></div>
        <Button variant="glass" full onclick={doGoogle} icon="user">Continue with Google</Button>
        <p class="switch text-sm text-2">
          {#if view === 'login'}
            New here? <button class="link-btn" onclick={() => show('signup')}>Create an account</button>
          {:else}
            Have an account? <button class="link-btn" onclick={() => show('login')}>Sign in</button>
          {/if}
        </p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .auth-wrap { min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 24px 16px calc(24px + env(safe-area-inset-bottom, 0)); }
  .landing { width: 100%; max-width: 420px; }
  .hero { padding: 36px 26px; border-radius: var(--r-xl); text-align: center; }
  .logo { width: 60px; height: 60px; margin: 0 auto 16px; display: grid; place-items: center; border-radius: var(--r-lg); background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: var(--text-on-accent); box-shadow: 0 10px 30px rgba(var(--accent-rgb), 0.45); }
  .title { font-size: 40px; font-weight: 800; letter-spacing: -0.03em; }
  .tagline { margin: 8px 0 24px; }
  .cta { display: flex; flex-direction: column; gap: 10px; }
  .features { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
  .feature { padding: 16px; border-radius: var(--r-lg); }
  .f-ic { width: 38px; height: 38px; display: grid; place-items: center; border-radius: var(--r-md); background: var(--glass-bg-strong); color: var(--accent); margin-bottom: 10px; }
  .f-title { font-weight: 700; font-size: var(--fs-sm); }
  .made { margin-top: 22px; }

  .card { width: 100%; max-width: 400px; padding: 30px 26px; border-radius: var(--r-xl); position: relative; }
  .back { position: absolute; top: 18px; left: 18px; color: var(--text-2); width: 34px; height: 34px; display: grid; place-items: center; border-radius: var(--r-full); }
  .back:hover { background: var(--glass-bg); color: var(--text); }
  .ct { font-size: 24px; margin-top: 10px; }
  .cs { margin-bottom: 22px; }
  .divider { display: flex; align-items: center; gap: 12px; margin: 18px 0; color: var(--text-3); font-size: var(--fs-xs); }
  .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--glass-border); }
  .link-btn { color: var(--accent); font-weight: 650; background: none; }
  .switch { text-align: center; margin-top: 18px; }
  form > :global(.btn) { margin-top: 4px; }
  button.link-btn.text-sm { display: block; margin: 14px auto 0; }
</style>
