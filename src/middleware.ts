// Every page needs a valid session, except the login page (docs/specs/04-auth.md).
// Static files (public/, /_astro/) never get here: Vercel serves them before calling the function.
import { defineMiddleware } from 'astro:middleware';
import { SESSION_SECRET } from 'astro:env/server';
import { SESSION_COOKIE, verifySessionToken } from './lib/auth/session.ts';

const LOGIN_PATH = '/login';

function isLoginPage(pathname: string) {
  return pathname === LOGIN_PATH || pathname === `${LOGIN_PATH}/`;
}

// Astro runs an action for a POST to any page with `?_action=<name>`, the login page included.
// Such a call needs a session like /_actions/<name> does, so it never counts as the login page.
function isActionCall(url: URL) {
  return url.searchParams.has('_action');
}

export const onRequest = defineMiddleware((context, next) => {
  if (isLoginPage(context.url.pathname) && !isActionCall(context.url)) return next();

  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (verifySessionToken(token, SESSION_SECRET)) return next();

  const target = context.url.pathname + context.url.search;
  return context.redirect(`${LOGIN_PATH}?next=${encodeURIComponent(target)}`);
});
