import { describe, expect, it } from 'vitest';
import type { Recipe } from './recipe.ts';
import { filterRecipes, matchesSheetFilters, searchRecipes } from './search.ts';

function recipe(overrides: Partial<Recipe> & { title: string }) {
  return {
    id: overrides.title,
    meals: [],
    ingredientsText: '',
    stepsText: '',
    ingredients: [],
    method: { steps: [] },
    hasInstructions: true,
    images: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Recipe;
}

const titles = (recipes: Recipe[]) => recipes.map((found) => found.title);

describe('searchRecipes', () => {
  const soup = recipe({ title: 'Kürbissuppe', ingredientsText: '1 Kürbis\n1 Zwiebel' });
  const pasta = recipe({ title: 'Nudeln', ingredientsText: '500 g Nudeln\n2 Zwiebeln' });
  const onions = recipe({ title: 'Zwiebelkuchen', ingredientsText: '1 kg Mehl' });
  const recipes = [soup, pasta, onions];

  it('matches name and ingredients, name matches first', () => {
    expect(titles(searchRecipes(recipes, 'zwiebel'))).toEqual([
      'Zwiebelkuchen',
      'Kürbissuppe',
      'Nudeln',
    ]);
  });

  it('ignores case and surrounding spaces', () => {
    expect(titles(searchRecipes(recipes, '  KÜRBIS '))).toEqual(['Kürbissuppe']);
  });

  it('returns everything for an empty query', () => {
    expect(searchRecipes(recipes, '  ')).toEqual(recipes);
  });

  it('returns nothing when nothing matches', () => {
    expect(searchRecipes(recipes, 'Schokolade')).toEqual([]);
  });
});

describe('filterRecipes', () => {
  const pancakes = recipe({
    title: 'Pfannkuchen',
    category: 'Hauptgericht',
    meals: ['Frühstück'],
    totalMinutes: 25,
  });
  const roast = recipe({
    title: 'Braten',
    category: 'Hauptgericht',
    meals: ['Mittag & Abend'],
    totalMinutes: 120,
  });
  const cake = recipe({
    title: 'Kuchen',
    category: 'Backen',
    meals: ['Backen'],
    hasInstructions: false,
  });
  const recipes = [pancakes, roast, cake];

  it('returns everything without filters', () => {
    expect(filterRecipes(recipes, {})).toEqual(recipes);
  });

  it('filters by meal', () => {
    expect(titles(filterRecipes(recipes, { meal: 'Frühstück' }))).toEqual(['Pfannkuchen']);
  });

  it('filters by any of the categories', () => {
    expect(titles(filterRecipes(recipes, { categories: ['Backen', 'Hauptgericht'] }))).toEqual([
      'Pfannkuchen',
      'Braten',
      'Kuchen',
    ]);
    expect(titles(filterRecipes(recipes, { categories: ['Backen'] }))).toEqual(['Kuchen']);
  });

  it('filters by total time and leaves out recipes without one', () => {
    expect(titles(filterRecipes(recipes, { maxTotalMinutes: 30 }))).toEqual(['Pfannkuchen']);
  });

  it('filters recipes with instructions', () => {
    expect(titles(filterRecipes(recipes, { onlyWithInstructions: true }))).toEqual([
      'Pfannkuchen',
      'Braten',
    ]);
  });

  it('combines filters', () => {
    const filters = {
      categories: ['Hauptgericht'],
      maxTotalMinutes: 130,
      meal: 'Mittag & Abend',
    } as const;
    expect(
      titles(filterRecipes(recipes, { ...filters, categories: [...filters.categories] })),
    ).toEqual(['Braten']);
  });
});

describe('matchesSheetFilters', () => {
  const recipeData = { category: 'Suppe', totalMinutes: 20, hasInstructions: true };

  it('matches everything without filters', () => {
    expect(matchesSheetFilters({ hasInstructions: false }, {})).toBe(true);
  });

  it('checks category, total time and instructions, and ignores the meal', () => {
    expect(matchesSheetFilters(recipeData, { categories: ['Suppe', 'Salat'] })).toBe(true);
    expect(matchesSheetFilters(recipeData, { categories: ['Salat'] })).toBe(false);
    expect(matchesSheetFilters({ hasInstructions: true }, { categories: ['Salat'] })).toBe(false);
    expect(matchesSheetFilters(recipeData, { maxTotalMinutes: 20 })).toBe(true);
    expect(matchesSheetFilters(recipeData, { maxTotalMinutes: 19 })).toBe(false);
    expect(matchesSheetFilters({ hasInstructions: true }, { maxTotalMinutes: 30 })).toBe(false);
    expect(matchesSheetFilters({ ...recipeData, hasInstructions: false }, {})).toBe(true);
    expect(
      matchesSheetFilters(
        { ...recipeData, hasInstructions: false },
        { onlyWithInstructions: true },
      ),
    ).toBe(false);
    expect(matchesSheetFilters(recipeData, { meal: 'Backen' })).toBe(true);
  });
});
