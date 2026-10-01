// Search and filters for the recipe list (docs/implementation-plan.md, "Data layer").
// Pure functions over already loaded recipes: the list is small, so the page filters in memory.

import type { Meal } from './fields.ts';
import type { Recipe } from './recipe.ts';

export type RecipeFilters = {
  meal?: Meal; // undefined = "Alle"
  categories?: string[]; // empty or undefined = any category
  maxTotalMinutes?: number; // "Bis 30 Min."; recipes without a total time don't match
  onlyWithInstructions?: boolean; // "Mit Anleitung"
};

function normalize(text: string) {
  return text.trim().toLocaleLowerCase('de');
}

/**
 * Recipes whose name or ingredients contain the query (case-insensitive).
 * Name matches come first; each group keeps the input order. An empty query matches all.
 */
export function searchRecipes(recipes: Recipe[], query: string) {
  const needle = normalize(query);
  if (needle === '') return recipes;

  const nameMatches: Recipe[] = [];
  const ingredientMatches: Recipe[] = [];
  for (const recipe of recipes) {
    if (normalize(recipe.title).includes(needle)) nameMatches.push(recipe);
    else if (normalize(recipe.ingredientsText).includes(needle)) ingredientMatches.push(recipe);
  }
  return [...nameMatches, ...ingredientMatches];
}

/** What the filters other than the meal look at. */
export type FilterableRecipe = Pick<Recipe, 'category' | 'totalMinutes' | 'hasInstructions'>;

/**
 * Whether a recipe passes the filters of the filter sheet (everything but the meal).
 * The sheet uses it too, to count the matches while chips are toggled.
 */
export function matchesSheetFilters(recipe: FilterableRecipe, filters: RecipeFilters) {
  const { categories = [], maxTotalMinutes, onlyWithInstructions } = filters;
  if (categories.length > 0 && !(recipe.category && categories.includes(recipe.category))) {
    return false;
  }
  if (maxTotalMinutes !== undefined) {
    if (recipe.totalMinutes === undefined || recipe.totalMinutes > maxTotalMinutes) return false;
  }
  if (onlyWithInstructions && !recipe.hasInstructions) return false;
  return true;
}

/** Recipes that satisfy every filter that is set. */
export function filterRecipes(recipes: Recipe[], filters: RecipeFilters) {
  const { meal } = filters;
  return recipes.filter(
    (recipe) =>
      (meal === undefined || recipe.meals.includes(meal)) && matchesSheetFilters(recipe, filters),
  );
}
