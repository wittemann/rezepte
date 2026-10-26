import { describe, expect, it } from 'vitest';
import { groupByCategory } from './group.ts';
import { searchRecipes } from './search.ts';
import { sortByRating } from './sort.ts';
import { makeRecipe } from './test-recipe.ts';

const titles = (recipes: { title: string }[]) => recipes.map((recipe) => recipe.title);

describe('sortByRating', () => {
  it('puts the most stars first and unrated recipes last, keeping the order otherwise', () => {
    const recipes = [
      makeRecipe({ title: 'A' }),
      makeRecipe({ title: 'B', rating: 3 }),
      makeRecipe({ title: 'C', rating: 5 }),
      makeRecipe({ title: 'D' }),
      makeRecipe({ title: 'E', rating: 3 }),
    ];
    expect(titles(sortByRating(recipes))).toEqual(['C', 'B', 'E', 'A', 'D']);
    expect(titles(recipes)).toEqual(['A', 'B', 'C', 'D', 'E']); // the input stays as it was
  });

  it('keeps name hits first in a search, each sorted by stars', () => {
    const recipes = sortByRating([
      makeRecipe({ title: 'Nudelauflauf', rating: 3 }),
      makeRecipe({ title: 'Nudelsalat', rating: 5 }),
      makeRecipe({ title: 'Nudelsuppe' }),
      makeRecipe({ title: 'Pfanne', rating: 4, ingredientsText: '200 g Nudeln' }),
      makeRecipe({ title: 'Topf', rating: 5, ingredientsText: '100 g Nudeln' }),
    ]);
    expect(titles(searchRecipes(recipes, 'nudel'))).toEqual([
      'Nudelsalat',
      'Nudelauflauf',
      'Nudelsuppe',
      'Topf',
      'Pfanne',
    ]);
  });

  it('keeps the category groups, each sorted by stars', () => {
    const recipes = sortByRating([
      makeRecipe({ title: 'Kuchen', category: 'Backen', rating: 2 }),
      makeRecipe({ title: 'Brot', category: 'Backen', rating: 4 }),
      makeRecipe({ title: 'Suppe', category: 'Suppe', rating: 5 }),
      makeRecipe({ title: 'Braten', category: 'Hauptgericht' }),
    ]);
    expect(groupByCategory(recipes).map((group) => titles(group.recipes))).toEqual([
      ['Braten'],
      ['Suppe'],
      ['Brot', 'Kuchen'],
    ]);
  });
});
