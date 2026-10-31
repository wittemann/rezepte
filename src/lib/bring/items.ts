// Turns picked ingredient lines into Bring items (docs/decisions/0014-bring-shopping-list.md):
// the amount and unit, scaled like on the recipe page, go into the specification, the rest of
// the line is the name, so Bring can match its catalog. Lines without a readable amount go in
// whole as the name. Headings are no items.

import type { IngredientLine } from '../recipes/ingredients.ts';
import { formatQuantity, scaleQuantity } from '../recipes/servings.ts';
import type { BringItem } from './client.ts';

/**
 * The ingredient lines at `indexes` (positions in the recipe's list), or undefined if one of them
 * doesn't exist or is a heading. The browser sends positions, not texts, so only the recipe's own
 * lines can reach the shopping list.
 */
export function pickLines(lines: IngredientLine[], indexes: number[]) {
  const picked: IngredientLine[] = [];
  for (const index of indexes) {
    const line = lines[index];
    if (line?.kind !== 'item') return undefined;
    picked.push(line);
  }
  return picked;
}

/** One Bring item per ingredient line, in order; `factor` scales the amounts (1 = as written). */
export function toBringItems(lines: IngredientLine[], factor: number) {
  const items: BringItem[] = [];
  for (const line of lines) {
    if (line.kind === 'heading') continue;
    const { quantity } = line;
    // "3" alone has no rest: then the whole line is the name
    if (!quantity || !quantity.rest) {
      items.push({ name: line.text });
      continue;
    }
    items.push({
      name: quantity.rest,
      specification: formatQuantity(scaleQuantity(quantity, factor)),
    });
  }
  return items;
}
