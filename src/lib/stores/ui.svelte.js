// ui.svelte.js — global UI state: toasts, confirm dialogs, command palette,
// quick capture, and celebration overlays. Rune-based singleton.

class UIStore {
  toasts = $state([]);
  confirmDialog = $state(null);     // { title, message, confirmText, danger, resolve }
  paletteOpen = $state(false);
  quickCaptureOpen = $state(false);
  celebration = $state(null);       // { kind, title, subtitle, icon }
  _id = 0;

  toast(message, type = 'info', duration = 3200) {
    const id = ++this._id;
    this.toasts = [...this.toasts, { id, message, type }];
    if (duration > 0) setTimeout(() => this.dismiss(id), duration);
    return id;
  }
  dismiss(id) { this.toasts = this.toasts.filter((t) => t.id !== id); }

  confirm({ title, message, confirmText = 'Confirm', danger = false }) {
    return new Promise((resolve) => {
      this.confirmDialog = { title, message, confirmText, danger, resolve };
    });
  }
  resolveConfirm(value) {
    const d = this.confirmDialog;
    this.confirmDialog = null;
    d?.resolve(value);
  }

  openPalette() { this.paletteOpen = true; }
  closePalette() { this.paletteOpen = false; }
  togglePalette() { this.paletteOpen = !this.paletteOpen; }

  openQuickCapture() { this.quickCaptureOpen = true; }
  closeQuickCapture() { this.quickCaptureOpen = false; }

  celebrate(payload) { this.celebration = payload; }
  clearCelebration() { this.celebration = null; }
}

export const ui = new UIStore();

// Convenience helpers (mirror the old snackbar API surface)
export const toast = (message, type, duration) => ui.toast(message, type, duration);
export const confirmDialog = (opts) => ui.confirm(opts);
