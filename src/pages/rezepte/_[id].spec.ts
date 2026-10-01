import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../lib/recipes/recipe.ts';
import { parseIngredients } from '../../lib/recipes/ingredients.ts';
import { parseMethod } from '../../lib/recipes/method.ts';
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

  it('answers 404 with its own message for an unknown recipe', async () => {
    const { response, document } = await renderPage(undefined);
    expect(response.status).toBe(404);
    expect(document.title).toBe('Rezept nicht gefunden');
    expect(document.querySelector('h1')?.textContent).toBe('Rezept nicht gefunden');
    expect(document.querySelector('main a')?.getAttribute('href')).toBe('/rezepte');
  });

  it('shows the ingredients only when the recipe has some', async () => {
    const without = await renderPage(makeRecipe());
    expect(without.document.body.textContent).not.toContain('Zutaten');

    const ingredients = parseIngredients('200 g Mehl');
    const { document } = await renderPage(makeRecipe({ ingredients, servings: 4 }));
    expect(document.querySelector('h2')?.textContent).toBe('Zutaten');
    expect(document.body.textContent).toContain('200 g');
  });

  it('shows steps for a recipe with instructions and the notes when there are some', async () => {
    const recipe = makeRecipe({ method: parseMethod('1. Backen.'), notes: 'Beispielnotiz' });
    const { document } = await renderPage(recipe);
    expect(document.querySelector('.steps .text')?.textContent).toBe('Backen.');
    expect(document.querySelector('details')?.textContent).toContain('Beispielnotiz');

    const bare = (await renderPage(makeRecipe({ hasInstructions: false }))).document;
    expect(bare.querySelector('.steps')).toBeNull();
    expect(bare.querySelector('details')).toBeNull();
  });
});
