// Turns picked ingredient lines into Bring items (docs/decisions/0014-bring-shopping-list.md):
// the amount and unit, scaled like on the recipe page, go into the specification, the rest of
// the line is the name, so Bring can match its catalog. Lines without a readable amount go in
// whole as the name. Headings are no items.

import type { IngredientLine } from '../recipes/ingredients.ts';
import { formatQuantity, scaleQuantity } from '../recipes/servings.ts';
import type { BringItem } from './client.ts';

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
