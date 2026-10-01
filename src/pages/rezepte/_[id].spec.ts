import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../lib/recipes/recipe.ts';
import { makeRecipe } from '../../lib/recipes/test-recipe.ts';
import RecipePage from './[id].astro';

vi.mock('astro:env/server', () => ({ AIRTABLE_TOKEN: 'token', AIRTABLE_BASE_ID: 'appTest' }));

const getById = vi.hoisted(() => vi.fn());
vi.mock('../../lib/recipes/repository.ts', () => ({ getById }));

async function renderPage(recipe: Recipe | undefined, id = 'recExample1') {
  getById.mockResolvedValue(recipe);
  const container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
  container.addClientRenderer({ name: '@astrojs/preact', entrypoint: '@astrojs/preact/client.js' });
  const response = await container.renderToResponse(RecipePage, {
    params: { id },
    request: new Request(`http://localhost/rezepte/${id}`),
  });
  const html = await response.text();
  return { response, document: new new Window().DOMParser().parseFromString(html, 'text/html') };
}

beforeEach(() => getById.mockReset());

describe('recipe page', () => {
  it('asks for the recipe of the URL and shows its title, without tab bar', async () => {
    const { document } = await renderPage(
      makeRecipe({ id: 'recX1', title: 'Beispiel Suppe' }),
      'recX1',
    );
    expect(getById).toHaveBeenCalledWith({ token: 'token', baseId: 'appTest' }, 'recX1');
    expect(document.title).toBe('Beispiel Suppe');
    expect(document.querySelector('h1')?.textContent).toBe('Beispiel Suppe');
    expect(document.querySelector('a[href="/favoriten"]')).toBeNull();
  });
});
