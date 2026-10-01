import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import type { Recipe } from '../lib/recipes/recipe.ts';
import { makeRecipe } from '../lib/recipes/test-recipe.ts';
import RecipeList from './RecipeList.astro';

const recipes = [
  makeRecipe({ id: 'recA', title: 'Beispiel Suppe', category: 'Suppe' }),
  makeRecipe({ id: 'recB', title: 'Beispiel Haupt 1', category: 'Hauptgericht' }),
  makeRecipe({ id: 'recC', title: 'Beispiel Haupt 2', category: 'Hauptgericht' }),
  makeRecipe({ id: 'recD', title: 'Beispiel Ohne', category: undefined }),
];

async function renderList(list: Recipe[], grouped: boolean) {
  const container = await AstroContainer.create();
  // Icon and Maulti are Preact components
  container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
  return container.renderToString(RecipeList, { props: { recipes: list, grouped } });
}

const headings = (html: string) =>
  [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gs)].map((match) => match[1]!.replace(/<[^>]+>/g, ''));

describe('RecipeList', () => {
  it('groups by category with a count, unknown categories last', async () => {
    const html = await renderList(recipes, true);
    expect(headings(html)).toEqual(['Hauptgericht2', 'Suppe1', 'Sonstiges1']);
    expect(html.match(/data-recipe-id="/g)).toHaveLength(4);
  });

  it('renders a flat list without headings', async () => {
    const html = await renderList(recipes, false);
    expect(headings(html)).toEqual([]);
    expect(html.match(/data-recipe-id="/g)).toHaveLength(4);
    expect(html.indexOf('Beispiel Suppe')).toBeLessThan(html.indexOf('Beispiel Haupt 1'));
  });

  it('shows Maulti and a hint when there are no recipes', async () => {
    for (const grouped of [true, false]) {
      const html = await renderList([], grouped);
      expect(html).toContain('Nichts gefunden');
      expect(html).toContain('Versuch es mit einer Zutat');
      expect(html).toContain('<svg');
      expect(html).not.toContain('data-recipe-id');
    }
  });
});
