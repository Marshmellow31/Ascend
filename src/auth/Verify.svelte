<script>
  import { authStore } from '../lib/stores/auth.svelte.js';
  import { sendVerification, reloadUser, logOut } from '../lib/auth.js';
  import { toast } from '../lib/stores/ui.svelte.js';
  import Icon from '../components/ui/Icon.svelte';
  import Button from '../components/ui/Button.svelte';

  let busy = $state(false);

  async function resend() {
    busy = true;
    try { await sendVerification(authStore.user); toast('Verification email sent', 'success'); }
    catch { toast('Could not send right now — try again shortly', 'error'); }
    finally { busy = false; }
  }
  async function check() {
    busy = true;
    const u = await reloadUser(authStore.user);
    busy = false;
    if (u?.emailVerified) { authStore.user = u; authStore.status = 'ready'; location.reload(); }
    else toast('Not verified yet — check your inbox (and spam)', 'warning');
  }
</script>

<div class="wrap">
  <div class="card glass glass-strong">
    <div class="ic"><Icon name="mail" size={28} /></div>
    <h2>Verify your email</h2>
    <p class="text-2 text-sm">We sent a verification link to<br /><strong>{authStore.user?.email}</strong></p>
    <div class="actions">
      <Button variant="primary" full loading={busy} onclick={check}>I've verified</Button>
      <Button variant="glass" full onclick={resend}>Resend email</Button>
    </div>
    <button class="signout text-sm muted" onclick={() => logOut()}>Use a different account</button>
  </div>
</div>

<style>
  .wrap { min-height: 100dvh; display: grid; place-items: center; padding: 24px; }
  .card { max-width: 380px; width: 100%; padding: 32px 26px; text-align: center; border-radius: var(--r-xl); }
  .ic { width: 58px; height: 58px; margin: 0 auto 16px; display: grid; place-items: center; border-radius: var(--r-full); background: rgba(var(--accent-rgb), 0.14); color: var(--accent); }
  .card h2 { margin-bottom: 8px; }
  .actions { display: flex; flex-direction: column; gap: 10px; margin: 22px 0 14px; }
  .signout { background: none; }
</style>
