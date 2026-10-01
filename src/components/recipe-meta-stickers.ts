// The values for the meta stickers of a recipe: only those it has, in display order.

import type { Recipe } from '../lib/recipes/recipe.ts';
import { formatDuration } from '../lib/recipes/time.ts';
import { TEXT } from './RecipeMeta.texts.ts';

export function recipeMetaStickers(
  recipe: Pick<Recipe, 'workMinutes' | 'totalMinutes' | 'caloriesPerServing'>,
) {
  const stickers: { label: string; value: string }[] = [];
  if (recipe.workMinutes !== undefined)
    stickers.push({ label: TEXT.workTime, value: formatDuration(recipe.workMinutes) });
  if (recipe.totalMinutes !== undefined)
    stickers.push({ label: TEXT.totalTime, value: formatDuration(recipe.totalMinutes) });
  if (recipe.caloriesPerServing !== undefined)
    stickers.push({
      label: TEXT.caloriesLabel,
      value: `${Math.round(recipe.caloriesPerServing)} ${TEXT.caloriesUnit}`,
    });
  return stickers;
}
