// The recipe list's state lives in the URL (docs/decisions/0006-forms-and-interactivity.md):
//   /rezepte?q=suppe&meal=breakfast&category=main&category=soup&max30=1&steps=1
// Parsing only accepts known values and ignores everything else, so a hand-made URL
// can't put anything unexpected into the page.

import { CATEGORIES, MEALS } from './fields.ts';
import type { RecipeFilters } from './search.ts';

export const LIST_PATH = '/rezepte';

/** "Bis 30 Min." */
export const QUICK_MINUTES = 30;

const MAX_QUERY_LENGTH = 100;

export interface ListQuery {
  /** Search text, trimmed; empty = no search */
  query: string;
  filters: RecipeFilters;
}

/** Reads the list state from URL parameters; unknown or invalid values count as not set. */
export function parseListQuery(params: URLSearchParams): ListQuery {
  const query = (params.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH);
  const meal = MEALS.find((entry) => entry.name === params.get('meal'))?.value;
  const requestedCategories = params.getAll('category');
  // In display order, each at most once
  const categories = CATEGORIES.filter((entry) => requestedCategories.includes(entry.name)).map(
    (entry) => entry.value,
  );

  const filters: RecipeFilters = {};
  if (meal) filters.meal = meal;
  if (categories.length > 0) filters.categories = categories;
  if (params.get('max30') === '1') filters.maxTotalMinutes = QUICK_MINUTES;
  if (params.get('steps') === '1') filters.onlyWithInstructions = true;
  return { query, filters };
}

/** The inverse of parseListQuery; parameters that aren't set are left out. */
export function toSearchParams({ query, filters }: ListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  const meal = MEALS.find((entry) => entry.value === filters.meal);
  if (meal) params.set('meal', meal.name);
  for (const entry of CATEGORIES) {
    if (filters.categories?.includes(entry.value)) params.append('category', entry.name);
  }
  if (filters.maxTotalMinutes !== undefined) params.set('max30', '1');
  if (filters.onlyWithInstructions) params.set('steps', '1');
  return params;
}

/** Link to the list with this state. */
export function listHref(listQuery: ListQuery): string {
  const search = toSearchParams(listQuery).toString();
  return search ? `${LIST_PATH}?${search}` : LIST_PATH;
}

/**
 * Number on the filter button: categories count as one filter however many are chosen,
 * like in the design. The meal has its own control and isn't counted.
 */
export function countActiveFilters(filters: RecipeFilters): number {
  return [
    (filters.categories?.length ?? 0) > 0,
    filters.maxTotalMinutes !== undefined,
    filters.onlyWithInstructions === true,
  ].filter(Boolean).length;
}

/** The filter sheet's form values: which chips are checked (categories by their URL name). */
export function toFilterChoices(filters: RecipeFilters): {
  categories: string[];
  quick: boolean;
  withInstructions: boolean;
} {
  return {
    categories: CATEGORIES.filter((entry) => filters.categories?.includes(entry.value)).map(
      (entry) => entry.name,
    ),
    quick: filters.maxTotalMinutes !== undefined,
    withInstructions: filters.onlyWithInstructions === true,
  };
}
