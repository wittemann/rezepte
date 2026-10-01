// Favorites are recipes with a "Favorit seit" time (docs/specs/03-data-model.md), newest first.

import type { Recipe } from './recipe.ts';

export function isFavorite(recipe: Recipe): boolean {
  return recipe.favoritedAt !== undefined;
}

/** The favorites, most recently marked first. */
export function sortFavorites(recipes: Recipe[]): Recipe[] {
  return recipes
    .filter(isFavorite)
    .sort((a, b) => Date.parse(b.favoritedAt!) - Date.parse(a.favoritedAt!));
}
