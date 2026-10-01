// Groups the recipe list by category when there is no search (design/README.md, "Rezepte").

import { CATEGORIES, categoryName, type Category } from './fields.ts';
import type { Recipe } from './recipe.ts';

export type CategoryGroup = {
  /** The Airtable category; undefined = recipes without a (known) category, shown last */
  category: Category | undefined;
  recipes: Recipe[];
};

/** One group per category in display order, each keeping the input order; empty groups are left out. */
export function groupByCategory(recipes: Recipe[]): CategoryGroup[] {
  const groups: CategoryGroup[] = CATEGORIES.map((entry) => ({
    category: entry.value,
    recipes: recipes.filter((recipe) => recipe.category === entry.value),
  }));
  const others = recipes.filter((recipe) => categoryName(recipe.category) === 'other');
  groups.push({ category: undefined, recipes: others });
  return groups.filter((group) => group.recipes.length > 0);
}
