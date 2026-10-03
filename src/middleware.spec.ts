import type { APIContext } from 'astro';
import { describe, expect, it, vi } from 'vitest';
import { createSessionToken } from './lib/auth/session.ts';
import { onRequest } from './middleware.ts';

// vi.mock runs before the imports, so the secret must be hoisted with it.
const SECRET = vi.hoisted(() => 'test-secret-with-at-least-32-characters');
vi.mock('astro:env/server', () => ({ SESSION_SECRET: SECRET }));

const PAGE = new Response('page');

// Only the parts of the context the middleware uses.
function run(path: string, cookie?: string) {
  const context = {
    url: new URL(path, 'https://example.test'),
    cookies: { get: () => (cookie === undefined ? undefined : { value: cookie }) },
    redirect: (location: string) => new Response(null, { status: 302, headers: { location } }),
  } as unknown as APIContext;
  return onRequest(context, async () => PAGE) as Promise<Response>;
}

describe('middleware', () => {
  it('lets a request with a valid session through', async () => {
    expect(await run('/rezepte', createSessionToken(SECRET))).toBe(PAGE);
  });

  it.each(['/login', '/login/', '/login?next=%2F'])(
    'lets %s through without a session',
    async (path) => {
      expect(await run(path)).toBe(PAGE);
    },
  );

  it('redirects to the login page without a session, keeping path and query', async () => {
    const response = await run('/rezepte?q=Kn%C3%B6del');
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/login?next=%2Frezepte%3Fq%3DKn%25C3%25B6del');
  });

  it('redirects with an invalid session', async () => {
    const response = await run('/', createSessionToken('another-secret-with-32-characters-x'));
    expect(response.headers.get('location')).toBe('/login?next=%2F');
  });

  it.each(['/login?_action=saveRecipe', '/login/?_action=setFavorite', '/login?_action='])(
    'does not run an action through %s without a session',
    async (path) => {
      expect((await run(path)).status).toBe(302);
    },
  );

  it('lets an action call on the login page through with a valid session', async () => {
    expect(await run('/login?_action=setFavorite', createSessionToken(SECRET))).toBe(PAGE);
  });

  it('does not treat paths that only start with /login as the login page', async () => {
    expect((await run('/login-other')).status).toBe(302);
  });
});
