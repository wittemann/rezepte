// The recipe list's state lives in the URL (docs/decisions/0006-forms-and-interactivity.md):
//   /recipes?q=suppe&meal=breakfast&category=main&category=soup&max30=1&steps=1
//     &rating=unrated&rating=4&sort=best
// Parsing only accepts known values and ignores everything else, so a hand-made URL
// can't put anything unexpected into the page.

import { CATEGORIES, MEALS, RATINGS } from './fields.ts';
import type { RatingChoice, RecipeFilters } from './search.ts';

export const LIST_PATH = '/recipes';

/** "Bis 30 Min." */
export const QUICK_MINUTES = 30;

const MAX_QUERY_LENGTH = 100;

/** The chips of the rating filter in display order; in the URL as `rating=unrated`, `rating=4`. */
export const RATING_CHOICES: RatingChoice[] = ['unrated', ...RATINGS];

/** "Beste zuerst"; without it the list is sorted A–Z. Not a filter: it isn't counted. */
export type ListSort = 'best';

export type ListQuery = {
  /** Search text, trimmed; empty = no search */
  query: string;
  filters: RecipeFilters;
  /** Missing = A–Z */
  sort?: ListSort;
};

/** Reads the list state from URL parameters; unknown or invalid values count as not set. */
export function parseListQuery(params: URLSearchParams) {
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
  const requestedRatings = params.getAll('rating');
  // In display order, each at most once
  const ratings = RATING_CHOICES.filter((choice) => requestedRatings.includes(String(choice)));
  if (ratings.length > 0) filters.ratings = ratings;
  const sort: ListSort | undefined = params.get('sort') === 'best' ? 'best' : undefined;
  return { query, filters, sort };
}

/** The inverse of parseListQuery; parameters that aren't set are left out. */
export function toSearchParams({ query, filters, sort }: ListQuery) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  const meal = MEALS.find((entry) => entry.value === filters.meal);
  if (meal) params.set('meal', meal.name);
  for (const entry of CATEGORIES) {
    if (filters.categories?.includes(entry.value)) params.append('category', entry.name);
  }
  if (filters.maxTotalMinutes !== undefined) params.set('max30', '1');
  if (filters.onlyWithInstructions) params.set('steps', '1');
  for (const choice of RATING_CHOICES) {
    if (filters.ratings?.includes(choice)) params.append('rating', String(choice));
  }
  if (sort) params.set('sort', sort);
  return params;
}

/** Link to the list with this state. */
export function listHref(listQuery: ListQuery) {
  const search = toSearchParams(listQuery).toString();
  return search ? `${LIST_PATH}?${search}` : LIST_PATH;
}

/**
 * Number on the filter button: categories count as one filter however many are chosen, and so do
 * ratings, like in the design. The meal has its own control and isn't counted, nor is the sort.
 */
export function countActiveFilters(filters: RecipeFilters) {
  return [
    (filters.categories?.length ?? 0) > 0,
    (filters.ratings?.length ?? 0) > 0,
    filters.maxTotalMinutes !== undefined,
    filters.onlyWithInstructions === true,
  ].filter(Boolean).length;
}

/** The filter sheet's form values: which chips are checked (categories and ratings by their URL value). */
export function toFilterChoices(filters: RecipeFilters) {
  return {
    ratings: RATING_CHOICES.filter((choice) => filters.ratings?.includes(choice)).map(String),
    categories: CATEGORIES.filter((entry) => filters.categories?.includes(entry.value)).map(
      (entry) => entry.name,
    ),
    quick: filters.maxTotalMinutes !== undefined,
    withInstructions: filters.onlyWithInstructions === true,
  };
}
