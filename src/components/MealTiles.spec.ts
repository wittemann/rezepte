import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import MealTiles from './MealTiles.astro';

const tiles = [
  { label: 'Frühstück', mealName: 'breakfast', active: true, href: '/?meal=breakfast' },
  { label: 'Abend', mealName: 'lunch-dinner', active: false, href: '/?meal=lunch-dinner' },
];

async function renderTiles() {
  const container = await AstroContainer.create();
  return container.renderToString(MealTiles, { props: { label: 'Mahlzeit', tiles } });
}

describe('MealTiles', () => {
  it('links every tile with its label and pastel color', async () => {
    const html = await renderTiles();
    expect(html).toContain('href="/?meal=lunch-dinner"');
    expect(html).toContain('--pastel-meal-lunch-dinner');
    expect(html).toContain('Abend');
  });

  it('marks only the active tile as current', async () => {
    const html = await renderTiles();
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-current="true"[^>]*>\s*Frühstück/);
  });
});
