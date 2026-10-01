// Second line of the recipe row: "1 Std. 5 Min. · 4 Portionen" or "Noch ohne Anleitung".

import { formatDuration } from '../lib/recipes/time.ts';
import type { Recipe } from '../lib/recipes/recipe.ts';
import { TEXT } from './RecipeRow.texts.ts';

const SEPARATOR = ' · ';

export function recipeRowMeta(
  recipe: Pick<Recipe, 'hasInstructions' | 'totalMinutes' | 'workMinutes' | 'servings'>,
) {
  if (!recipe.hasInstructions) return TEXT.noInstructions;

  // Total time when known, else the work time (as in the design prototype)
  const minutes = recipe.totalMinutes ?? recipe.workMinutes;
  const parts = [
    minutes === undefined ? undefined : formatDuration(minutes),
    recipe.servings === undefined ? undefined : formatServings(recipe.servings),
  ];
  return parts.filter((part) => part !== undefined).join(SEPARATOR);
}

function formatServings(servings: number) {
  return `${String(servings).replace('.', ',')} ${servings === 1 ? TEXT.singleServing : TEXT.servings}`;
}
