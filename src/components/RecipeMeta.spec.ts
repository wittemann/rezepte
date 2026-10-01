import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { makeRecipe } from '../lib/recipes/test-recipe.ts';
import RecipeMeta from './RecipeMeta.astro';

async function render(overrides = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(RecipeMeta, { props: { recipe: makeRecipe(overrides) } });
}

describe('RecipeMeta', () => {
  it('shows one sticker per known value', async () => {
    const html = await render({ workMinutes: 35, totalMinutes: 65, caloriesPerServing: 292 });
    expect(html.match(/class="sticker[ "]/g)).toHaveLength(3);
    expect(html).toContain('1 Std. 5 Min.');
    expect(html).toContain('292 kcal');
  });

  it('renders nothing without values', async () => {
    expect(await render()).not.toContain('sticker');
  });
});
