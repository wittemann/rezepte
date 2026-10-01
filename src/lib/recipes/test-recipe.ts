// A complete, valid Recipe for tests. Specs override only the fields they care about,
// so a new required field on Recipe is added here once instead of in every spec.
import type { Recipe } from './recipe.ts';

export function makeRecipe(overrides: Partial<Recipe> = {}) {
  return {
    id: 'recExample1',
    title: 'Beispielrezept A',
    meals: [],
    ingredientsText: '',
    stepsText: '',
    ingredients: [],
    method: { sections: [] },
    hasInstructions: true,
    images: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
