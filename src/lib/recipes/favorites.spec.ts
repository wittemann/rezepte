import { describe, expect, it } from 'vitest';
import { isFavorite, sortFavorites } from './favorites.ts';
import { makeRecipe } from './test-recipe.ts';

describe('isFavorite', () => {
  it('is true only when "Favorit seit" is set', () => {
    expect(isFavorite(makeRecipe({ favoritedAt: '2026-10-01T08:00:00.000Z' }))).toBe(true);
    expect(isFavorite(makeRecipe())).toBe(false);
  });
});

describe('sortFavorites', () => {
  it('keeps only favorites, most recently marked first', () => {
    const old = makeRecipe({ id: 'recOld', favoritedAt: '2026-09-01T08:00:00.000Z' });
    const recent = makeRecipe({ id: 'recNew', favoritedAt: '2026-10-01T08:00:00.000Z' });
    const none = makeRecipe({ id: 'recNone' });

    expect(sortFavorites([old, none, recent]).map((recipe) => recipe.id)).toEqual([
      'recNew',
      'recOld',
    ]);
  });

  it('does not change the input order', () => {
    const recipes = [
      makeRecipe({ id: 'recA', favoritedAt: '2026-09-01T08:00:00.000Z' }),
      makeRecipe({ id: 'recB', favoritedAt: '2026-10-01T08:00:00.000Z' }),
    ];
    sortFavorites(recipes);
    expect(recipes.map((recipe) => recipe.id)).toEqual(['recA', 'recB']);
  });
});
