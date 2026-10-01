// Where to go after logging in (docs/specs/04-auth.md): the `next` query parameter,
// but only if it stays on our site. Otherwise anyone could send a login link that
// redirects to a fake site right after a real login (open redirect).

const FALLBACK = '/';
const LOGIN_PATHS = ['/login', '/login/'];

// Any origin works; it's only used to see whether the URL parser leaves it.
const BASE = new URL('https://app.invalid');

/**
 * Returns `next` as a local path (path, query and hash), or `/` if it's missing,
 * would lead to another site, or points back to the login page.
 */
export function safeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith('/')) return FALLBACK;

  // Browsers read `//host`, `/\host` and paths with tabs or line breaks as links to
  // another site. Parsing the way a browser does catches all of these.
  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return FALLBACK;
  }
  if (url.origin !== BASE.origin) return FALLBACK;
  // A logged-in visitor on /login is sent on to `next`; pointing back would loop
  if (LOGIN_PATHS.includes(url.pathname)) return FALLBACK;

  return url.pathname + url.search + url.hash;
}
