// Every page needs a valid session, except the login page (docs/specs/04-auth.md).
// Static files (public/, /_astro/) never get here: Vercel serves them before calling the function.
import { defineMiddleware } from 'astro:middleware';
import { SESSION_SECRET } from 'astro:env/server';
import { SESSION_COOKIE, verifySessionToken } from './lib/auth/session.ts';

const LOGIN_PATH = '/login';

function isLoginPage(pathname: string): boolean {
  return pathname === LOGIN_PATH || pathname === `${LOGIN_PATH}/`;
}

export const onRequest = defineMiddleware((context, next) => {
  if (isLoginPage(context.url.pathname)) return next();

  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (verifySessionToken(token, SESSION_SECRET)) return next();

  const target = context.url.pathname + context.url.search;
  return context.redirect(`${LOGIN_PATH}?next=${encodeURIComponent(target)}`);
});
