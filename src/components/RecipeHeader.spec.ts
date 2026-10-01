import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';
import { describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../lib/recipes/recipe.ts';
import { makeRecipe } from '../lib/recipes/test-recipe.ts';
import RecipeHeader from './RecipeHeader.astro';

// The heart is an island; it only needs to render here
vi.mock('astro:actions', () => ({ actions: {} }));

async function renderHeader(overrides: Partial<Recipe> = {}) {
  const container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
  container.addClientRenderer({ name: '@astrojs/preact', entrypoint: '@astrojs/preact/client.js' });
  const html = await container.renderToString(RecipeHeader, {
    props: { recipe: makeRecipe({ id: 'recX1', category: 'Suppe', ...overrides }) },
  });
  return new new Window().DOMParser().parseFromString(html, 'text/html');
}

describe('RecipeHeader', () => {
  it('shows category, title, back link and the edit link', async () => {
    const document = await renderHeader({ title: 'Beispiel Suppe' });
    expect(document.querySelector('h1')?.textContent).toBe('Beispiel Suppe');
    expect(document.body.textContent).toContain('Suppe');
    expect(document.querySelector('a[aria-label="Zurück"]')?.getAttribute('href')).toBe('/rezepte');
    const edit = [...document.querySelectorAll('a')].find(
      (a) => a.textContent?.trim() === 'Bearbeiten',
    );
    expect(edit?.getAttribute('href')).toBe('/rezepte/recX1/edit');
  });

  it('uses the category color, a neutral one for an unknown category', async () => {
    expect((await renderHeader()).querySelector('header')?.getAttribute('style')).toContain(
      '--pastel-cat-soup',
    );
    const unknown = await renderHeader({ category: 'Neu' });
    expect(unknown.querySelector('header')?.getAttribute('style')).toContain('--pastel-cat-other');
  });

  it('shows the first photo only when there is one', async () => {
    expect((await renderHeader()).querySelector('img')).toBeNull();
    const document = await renderHeader({
      images: [{ id: 'attA', url: '/img/recX1/attA' }],
    });
    expect(document.querySelector('img')?.getAttribute('src')).toBe('/img/recX1/attA');
  });

  it('links the source when the recipe has a link, else shows it as text', async () => {
    const linked = await renderHeader({ source: 'Chefkoch', sourceUrl: 'https://example.test/r' });
    expect(linked.querySelector('.source')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'von Chefkoch',
    );
    expect(linked.querySelector('.source a')?.getAttribute('href')).toBe('https://example.test/r');

    const plain = await renderHeader({ source: 'Oma' });
    expect(plain.querySelector('.source a')).toBeNull();
    expect(plain.querySelector('.source')?.textContent).toContain('Oma');
    expect((await renderHeader()).querySelector('.source')).toBeNull();
  });

  it('has Maulti wave, or hold a heart for a favorite', async () => {
    const wave = await renderHeader();
    const heart = await renderHeader({ favoritedAt: '2026-10-01T08:00:00.000Z' });
    expect(wave.querySelector('.mascot svg')?.outerHTML).not.toBe(
      heart.querySelector('.mascot svg')?.outerHTML,
    );
    expect(heart.querySelector('button[aria-pressed="true"]')).not.toBeNull();
    expect(wave.querySelector('button[aria-pressed="false"]')).not.toBeNull();
  });
});
