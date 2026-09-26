// Where to go after logging in (docs/specs/04-auth.md): the `next` query parameter,
// but only if it stays on our site. Otherwise anyone could send a login link that
// redirects to a fake site right after a real login (open redirect).

const FALLBACK = '/';

// Any origin works; it's only used to see whether the URL parser leaves it.
const BASE = new URL('https://app.invalid');

/**
 * Returns `next` as a local path (path, query and hash), or `/` if it's missing
 * or would lead to another site.
 */
export function safeNextPath(next: string | null | undefined): string {
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

  return url.pathname + url.search + url.hash;
}
