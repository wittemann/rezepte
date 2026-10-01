import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import type { Recipe } from '../lib/recipes/recipe.ts';
import { makeRecipe } from '../lib/recipes/test-recipe.ts';
import RecipeRow from './RecipeRow.astro';

const recipe = makeRecipe({ category: 'Suppe', servings: 4, totalMinutes: 65 });

async function renderRow(overrides: Partial<Recipe> = {}): Promise<string> {
  const container = await AstroContainer.create();
  // Icon is a Preact component
  container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
  return container.renderToString(RecipeRow, {
    props: { recipe: { ...recipe, ...overrides } },
  });
}

/** Opening tag of the heart wrapper */
function heartTag(html: string): string {
  return /<span class="heart[^>]*>/.exec(html)?.[0] ?? '';
}

describe('RecipeRow', () => {
  it('links to the recipe with title and meta', async () => {
    const html = await renderRow();
    expect(html).toContain('href="/rezepte/recExample1"');
    expect(html).toContain('Beispielrezept A');
    expect(html).toContain('1 Std. 5 Min. · 4 Portionen');
  });

  it('shows the first photo when there is one', async () => {
    const images = [
      { id: 'att1', url: '/img/first.jpg' },
      { id: 'att2', url: '/img/second.jpg' },
    ];
    const html = await renderRow({ images });
    expect(html).toContain('src="/img/first.jpg"');
    expect(html).not.toContain('second.jpg');
  });

  it('draws an initial tile in the category color without a photo', async () => {
    const html = await renderRow({ title: 'ärger', category: 'Suppe' });
    expect(html).toContain('Ä');
    expect(html).toContain('var(--pastel-cat-soup)');
    expect(html).not.toContain('<img');
  });

  it('uses the neutral color for an unknown or missing category', async () => {
    expect(await renderRow({ category: 'Etwas Neues' })).toContain('var(--pastel-cat-other)');
    expect(await renderRow({ category: undefined })).toContain('var(--pastel-cat-other)');
  });

  it('says "Noch ohne Anleitung" for a stub', async () => {
    const html = await renderRow({ hasInstructions: false });
    expect(html).toContain('Noch ohne Anleitung');
  });

  it('renders the heart filled for a favorite', async () => {
    const html = await renderRow({ favoritedAt: '2026-10-01T08:00:00.000Z' });
    expect(heartTag(html)).toContain('aria-label="Favorit"');
    expect(html).toContain('fill="currentColor"');
  });

  it('marks the link with the recipe id', async () => {
    expect(await renderRow()).toContain('data-recipe-id="recExample1"');
  });

  it('renders no heart when not a favorite', async () => {
    expect(heartTag(await renderRow())).toBe('');
  });

  it('keeps a decomposed accented letter whole', async () => {
    const html = await renderRow({ title: 'éclair' }); // e + combining acute
    expect(html).toContain('É<');
  });

  it('renders no meta line when there is nothing to show', async () => {
    const html = await renderRow({ totalMinutes: undefined, servings: undefined });
    expect(html).not.toContain('class="meta');
  });
});
