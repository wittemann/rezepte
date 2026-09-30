import { describe, expect, it } from 'vitest';
import { groupByCategory } from './group.ts';
import { makeRecipe } from './test-recipe.ts';

const titles = (recipes: { title: string }[]) => recipes.map((recipe) => recipe.title);

describe('groupByCategory', () => {
  it('groups in display order and keeps the input order inside a group', () => {
    const groups = groupByCategory([
      makeRecipe({ title: 'Suppe A', category: 'Suppe' }),
      makeRecipe({ title: 'Haupt A', category: 'Hauptgericht' }),
      makeRecipe({ title: 'Suppe B', category: 'Suppe' }),
    ]);
    expect(groups.map((group) => group.category)).toEqual(['Hauptgericht', 'Suppe']);
    expect(titles(groups[1]!.recipes)).toEqual(['Suppe A', 'Suppe B']);
  });

  it('puts recipes without a known category last', () => {
    const groups = groupByCategory([
      makeRecipe({ title: 'Ohne', category: undefined }),
      makeRecipe({ title: 'Neu', category: 'Etwas Neues' }),
      makeRecipe({ title: 'Haupt', category: 'Hauptgericht' }),
    ]);
    expect(groups.map((group) => group.category)).toEqual(['Hauptgericht', undefined]);
    expect(titles(groups[1]!.recipes)).toEqual(['Ohne', 'Neu']);
  });

  it('returns no groups without recipes', () => {
    expect(groupByCategory([])).toEqual([]);
  });
});
