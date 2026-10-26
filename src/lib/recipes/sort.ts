// "Beste zuerst" in the recipe list (design/README.md, "Filter-Sheet und Sortierung").

import type { Recipe } from './recipe.ts';

/**
 * The recipes with the most stars first and unrated ones last; recipes with the same rating keep
 * their order. Sorting before searching and grouping is enough for both views: the search keeps
 * this order within name and ingredient hits, the grouping within each category.
 */
export function sortByRating(recipes: Recipe[]) {
  return recipes.toSorted((first, second) => (second.rating ?? 0) - (first.rating ?? 0));
}
