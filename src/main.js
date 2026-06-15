import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

// Capture the PWA install prompt as early as possible
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__deferredPrompt = e;
  window.dispatchEvent(new Event('pwa-prompt-ready'));
});

const app = mount(App, { target: document.getElementById('app') });

export default app;
