// router.svelte.js — minimal hash router (robust for installed PWAs; works with
// the SPA fallback already in vercel.json). Rune-based reactive state.

function parseHash() {
  const raw = (typeof location !== 'undefined' ? location.hash : '').replace(/^#\/?/, '');
  const [path, queryStr] = raw.split('?');
  const params = {};
  if (queryStr) for (const [k, v] of new URLSearchParams(queryStr)) params[k] = v;
  return { path: path || 'dashboard', params };
}

class Router {
  current = $state(parseHash());

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => {
        this.current = parseHash();
        window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      });
    }
  }

  get path() { return this.current.path; }
  get params() { return this.current.params; }

  go(path, params = {}) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString();
    const next = `#/${path}${qs ? '?' + qs : ''}`;
    if (location.hash === next) {
      this.current = parseHash(); // force re-render on identical route
    } else {
      location.hash = next;
    }
  }

  back() { history.back(); }
}

export const router = new Router();
export const navigate = (path, params) => router.go(path, params);
