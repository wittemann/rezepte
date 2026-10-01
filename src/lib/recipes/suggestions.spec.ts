import { describe, expect, it } from 'vitest';
import type { Meal } from './fields.ts';
import type { Recipe } from './recipe.ts';
import { MAX_SUGGESTIONS, suggestRecipes } from './suggestions.ts';

function recipe(title: string, meals: Meal[], totalMinutes?: number) {
  return { id: title, title, meals, totalMinutes } as Recipe;
}

const titles = (recipes: Recipe[]) => recipes.map((found) => found.title);

const dinners = Array.from({ length: 12 }, (_, index) =>
  recipe(`Abendessen ${index}`, ['Mittag & Abend'], 20),
);
const request = { meal: 'Mittag & Abend', day: '2026-09-30', diceSeed: 0 } as const;

describe('suggestRecipes', () => {
  it('returns at most six recipes', () => {
    expect(suggestRecipes(dinners, request)).toHaveLength(MAX_SUGGESTIONS);
  });

  it('returns all matching recipes when there are fewer than six', () => {
    expect(suggestRecipes(dinners.slice(0, 3), request)).toHaveLength(3);
  });

  it('only suggests recipes of the meal, none without a meal', () => {
    const recipes = [
      recipe('Müsli', ['Frühstück']),
      recipe('Ohne Mahlzeit', []),
      recipe('Suppe', ['Mittag & Abend']),
    ];
    expect(titles(suggestRecipes(recipes, request))).toEqual(['Suppe']);
  });

  it('applies the time limit and counts an unknown time as matching', () => {
    const recipes = [
      recipe('Schnell', ['Mittag & Abend'], 30),
      recipe('Lang', ['Mittag & Abend'], 31),
      recipe('Unbekannt', ['Mittag & Abend']),
    ];
    const found = suggestRecipes(recipes, { ...request, maxTotalMinutes: 30 });
    expect(titles(found).sort()).toEqual(['Schnell', 'Unbekannt']);
    expect(suggestRecipes(recipes, request)).toHaveLength(3);
  });

  it('gives the same picks for the same day, meal and seed', () => {
    expect(suggestRecipes(dinners, request)).toEqual(suggestRecipes(dinners, request));
  });

  it('gives other picks for another day or dice seed', () => {
    const first = titles(suggestRecipes(dinners, request));
    expect(titles(suggestRecipes(dinners, { ...request, diceSeed: 1 }))).not.toEqual(first);
    expect(titles(suggestRecipes(dinners, { ...request, day: '2026-10-01' }))).not.toEqual(first);
  });

  it('returns nothing when no recipe matches', () => {
    expect(suggestRecipes([], request)).toEqual([]);
  });
});
