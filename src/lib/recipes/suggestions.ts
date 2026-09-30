// Suggestions for the start page carousel (design/README.md, "Vorschläge").
// Deterministic: the same day, meal and dice seed give the same picks, so a reload keeps them
// and "Nochmal würfeln" only has to change the seed.

import type { Meal } from './fields.ts';
import type { Recipe } from './recipe.ts';

export const MAX_SUGGESTIONS = 6;

export interface SuggestionRequest {
  meal: Meal;
  maxTotalMinutes?: number; // "Wenig Zeit": 30, or 90 for baking; undefined = "Viel Zeit"
  day: string; // e.g. "2026-09-30"; the picks change daily
  diceSeed: number; // 0 first, +1 per "Nochmal würfeln"
}

/** Up to MAX_SUGGESTIONS recipes of the meal within the time limit, in shuffled order. */
export function suggestRecipes(recipes: Recipe[], request: SuggestionRequest): Recipe[] {
  const { meal, maxTotalMinutes, day, diceSeed } = request;
  const matching = recipes.filter(
    (recipe) =>
      recipe.meals.includes(meal) &&
      (maxTotalMinutes === undefined ||
        recipe.totalMinutes === undefined || // unknown time counts as matching
        recipe.totalMinutes <= maxTotalMinutes),
  );
  const shuffleKey = `${day}|${meal}|${diceSeed}`;
  // Sorting by a hash of key + recipe ID is a shuffle that only depends on the key.
  const shuffled = matching
    .map((recipe) => ({ recipe, order: hash(`${shuffleKey}|${recipe.id}`) }))
    .sort((first, second) => first.order - second.order)
    .map(({ recipe }) => recipe);
  return shuffled.slice(0, MAX_SUGGESTIONS);
}

/**
 * Turns text into a number that looks random but is always the same for the same text.
 * JavaScript has no built-in for this (`crypto.subtle` is async, `Math.random` can't be seeded).
 * This is FNV-1a: mix in each character with an XOR and a multiplication.
 */
function hash(text: string): number {
  let value = 0x811c9dc5; // FNV's fixed start value
  for (const character of text) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 0x01000193); // FNV's fixed prime, multiplied as 32-bit integers
  }
  return value >>> 0;
}
