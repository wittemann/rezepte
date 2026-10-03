import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../lib/recipes/recipe.ts';
import { makeRecipe } from '../lib/recipes/test-recipe.ts';
import FavoritesPage from './favorites.astro';

vi.mock('astro:env/server', () => ({ AIRTABLE_TOKEN: 'token', AIRTABLE_BASE_ID: 'appTest' }));

const recipes = vi.hoisted(() => ({ current: [] as Recipe[] }));
vi.mock('../lib/recipes/repository.ts', () => ({ getAll: async () => recipes.current }));

async function renderPage() {
  const container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
  const html = await container.renderToString(FavoritesPage, {
    request: new Request('http://localhost/favorites'),
  });
  return new new Window().DOMParser().parseFromString(html, 'text/html');
}

const titles = (document: Awaited<ReturnType<typeof renderPage>>) =>
  [...document.querySelectorAll('[data-recipe-id] .title')].map((title) => title.textContent);

beforeEach(() => {
  recipes.current = [
    makeRecipe({ id: 'recA', title: 'Beispiel Alt', favoritedAt: '2026-09-01T08:00:00.000Z' }),
    makeRecipe({ id: 'recB', title: 'Beispiel Kein Favorit' }),
    makeRecipe({ id: 'recC', title: 'Beispiel Neu', favoritedAt: '2026-10-01T08:00:00.000Z' }),
  ];
});

describe('favorites page', () => {
  it('lists only favorites, most recently marked first, with the count', async () => {
    const document = await renderPage();
    expect(titles(document)).toEqual(['Beispiel Neu', 'Beispiel Alt']);
    expect(document.querySelector('.count')?.textContent).toBe('2 Rezepte');
  });

  it('has the favorites tab active and one <main> with the heading', async () => {
    const document = await renderPage();
    expect(document.querySelector('a[aria-current="page"]')?.textContent).toContain('Favoriten');
    expect(document.querySelectorAll('main')).toHaveLength(1);
    expect(document.querySelector('main h1')?.textContent).toBe('Favoriten');
  });

  it('shows the singular for one favorite', async () => {
    recipes.current = [makeRecipe({ favoritedAt: '2026-10-01T08:00:00.000Z' })];
    expect((await renderPage()).querySelector('.count')?.textContent).toBe('1 Rezept');
  });

  it('shows the empty state without favorites', async () => {
    recipes.current = [makeRecipe()];
    const document = await renderPage();
    expect(titles(document)).toEqual([]);
    expect(document.querySelector('main')?.textContent).toContain('Noch keine Favoriten');
    expect(document.querySelector('main svg')).not.toBeNull();
    expect(document.querySelector('.count')?.textContent).toBe('0 Rezepte');
  });
});
