import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../lib/recipes/recipe.ts';
import { parseMethod } from '../../../lib/recipes/method.ts';
import { makeRecipe } from '../../../lib/recipes/test-recipe.ts';
import CookPage from './cook.astro';

vi.mock('astro:env/server', () => ({ AIRTABLE_TOKEN: 'token', AIRTABLE_BASE_ID: 'appTest' }));

const getById = vi.hoisted(() => vi.fn());
vi.mock('../../../lib/recipes/repository.ts', () => ({ getById }));

async function renderPage(recipe: Recipe | undefined, id = 'recExample1') {
  getById.mockResolvedValue(recipe);
  const container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
  container.addClientRenderer({ name: '@astrojs/preact', entrypoint: '@astrojs/preact/client.js' });
  const response = await container.renderToResponse(CookPage, {
    params: { id },
    request: new Request(`http://localhost/recipes/${id}/cook`),
  });
  const html = await response.text();
  return { response, document: new new Window().DOMParser().parseFromString(html, 'text/html') };
}

beforeEach(() => getById.mockReset());

describe('cooking mode page', () => {
  it('shows the first step of the requested recipe, without tab bar', async () => {
    const recipe = makeRecipe({ id: 'recX1', method: parseMethod('1. Erst.\n2. Dann.') });
    const { document } = await renderPage(recipe, 'recX1');
    expect(getById).toHaveBeenCalledWith({ token: 'token', baseId: 'appTest' }, 'recX1');
    expect(document.body.textContent).toContain('Schritt 1 von 2');
    expect(document.body.textContent).toContain('Erst.');
    expect(document.querySelector('a[href="/favorites"]')).toBeNull();
  });

  it('sends a recipe without steps back to its page', async () => {
    const { response } = await renderPage(makeRecipe({ id: 'recX1', hasInstructions: false }));
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/recipes/recX1');
  });

  it('answers 404 for an unknown recipe', async () => {
    const { response, document } = await renderPage(undefined);
    expect(response.status).toBe(404);
    expect(document.querySelector('h1')?.textContent).toBe('Rezept nicht gefunden');
  });
});
