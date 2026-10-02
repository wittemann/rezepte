import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { makeRecipe } from '../lib/recipes/test-recipe.ts';
import SuggestionCarousel from './SuggestionCarousel.astro';

async function render(recipes: Parameters<typeof makeRecipe>[0][]) {
  const container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
  return container.renderToString(SuggestionCarousel, {
    props: {
      recipes: recipes.map((recipe) => makeRecipe(recipe)),
      mealName: 'breakfast',
      rerollHref: '/?dice=1',
    },
  });
}

describe('SuggestionCarousel', () => {
  it('shows category, short time and title of a card, linked to the recipe', async () => {
    const html = await render([
      { id: 'recX', title: 'Beispiel', category: 'Dessert', totalMinutes: 65 },
    ]);
    expect(html).toContain('href="/rezepte/recX"');
    expect(html).toContain('Dessert');
    expect(html).toContain('1h05');
    expect(html).toContain('Beispiel');
  });

  it('leaves out the time pill and category pill when unknown', async () => {
    const html = await render([{ title: 'Beispiel' }]);
    expect(html).not.toMatch(/class="pill /);
  });

  it('ends with the reroll card', async () => {
    const html = await render([{ title: 'Beispiel' }]);
    expect(html).toContain('href="/?dice=1"');
    expect(html).toContain('Nochmal würfeln');
  });

  it('shows the empty message without cards or reroll', async () => {
    const html = await render([]);
    expect(html).toContain('dazu finde ich nichts');
    expect(html).not.toContain('Nochmal würfeln');
  });
});
