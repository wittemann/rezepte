// Search and filters for the recipe list (docs/implementation-plan.md, "Data layer").
// Pure functions over already loaded recipes: the list is small, so the page filters in memory.

import type { Meal } from './fields.ts';
import type { Recipe } from './recipe.ts';

export interface RecipeFilters {
  meal?: Meal; // undefined = "Alle"
  categories?: string[]; // empty or undefined = any category
  maxTotalMinutes?: number; // "Bis 30 Min."; recipes without a total time don't match
  onlyWithInstructions?: boolean; // "Mit Anleitung"
}

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase('de');
}

/**
 * Recipes whose name or ingredients contain the query (case-insensitive).
 * Name matches come first; each group keeps the input order. An empty query matches all.
 */
export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
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

/** Recipes that satisfy every filter that is set. */
export function filterRecipes(recipes: Recipe[], filters: RecipeFilters): Recipe[] {
  const { meal, categories = [], maxTotalMinutes, onlyWithInstructions } = filters;
  return recipes.filter((recipe) => {
    if (meal !== undefined && !recipe.meals.includes(meal)) return false;
    if (categories.length > 0 && !(recipe.category && categories.includes(recipe.category))) {
      return false;
    }
    if (maxTotalMinutes !== undefined) {
      if (recipe.totalMinutes === undefined || recipe.totalMinutes > maxTotalMinutes) return false;
    }
    if (onlyWithInstructions && !recipe.hasInstructions) return false;
    return true;
  });
}
