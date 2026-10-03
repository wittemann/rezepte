import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CategoryGrid from './CategoryGrid.astro';

describe('CategoryGrid', () => {
  it('links each category with its name and recipe count', async () => {
    const container = await AstroContainer.create();
    container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
    const html = await container.renderToString(CategoryGrid, {
      props: {
        categories: [
          { label: 'Suppe', name: 'soup', recipeCount: 1, href: '/recipes?category=soup' },
          { label: 'Salat', name: 'salad', recipeCount: 7, href: '/recipes?category=salad' },
        ],
      },
    });
    expect(html).toContain('href="/recipes?category=soup"');
    expect(html).toContain('1 Rezept<');
    expect(html).toContain('7 Rezepte');
    expect(html).toContain('--pastel-cat-salad');
  });
});
