import { describe, expect, it } from 'vitest';
import {
  countActiveFilters,
  listHref,
  parseListQuery,
  toFilterChoices,
  toSearchParams,
  type ListQuery,
} from './list-query.ts';

const parse = (search: string) => parseListQuery(new URLSearchParams(search));

describe('parseListQuery', () => {
  it('reads an empty URL as no search and no filters', () => {
    expect(parse('')).toEqual({ query: '', filters: {} });
  });

  it('reads every parameter', () => {
    expect(
      parse('q=%20Suppe%20&meal=breakfast&category=soup&category=main&max30=1&steps=1'),
    ).toEqual({
      query: 'Suppe',
      filters: {
        meal: 'Frühstück',
        categories: ['Hauptgericht', 'Suppe'], // display order
        maxTotalMinutes: 30,
        onlyWithInstructions: true,
      },
    });
  });

  it('reads the ratings in display order, each once, and the sort', () => {
    expect(parse('rating=4&rating=unrated&rating=4&rating=9&rating=&sort=best')).toEqual({
      query: '',
      filters: { ratings: ['unrated', 4] },
      sort: 'best',
    });
  });

  it('sorts A–Z for anything but "best"', () => {
    expect(parse('sort=worst').sort).toBeUndefined();
  });

  it('ignores unknown meals, categories and flags', () => {
    expect(
      parse('meal=Frühstück&category=pizza&category=soup&category=soup&max30=yes&steps=0'),
    ).toEqual({ query: '', filters: { categories: ['Suppe'] } });
  });

  it('cuts overlong search text', () => {
    expect(parse(`q=${'a'.repeat(500)}`).query).toHaveLength(100);
  });
});

describe('toSearchParams and listHref', () => {
  const full: ListQuery = {
    query: 'Käse',
    filters: {
      meal: 'Mittag & Abend',
      categories: ['Beilage', 'Salat'],
      maxTotalMinutes: 30,
      onlyWithInstructions: true,
      ratings: ['unrated', 5],
    },
    sort: 'best',
  };

  it('round-trips through parseListQuery', () => {
    expect(parseListQuery(toSearchParams(full))).toEqual(full);
  });

  it('leaves out what is not set', () => {
    expect(listHref({ query: '', filters: {} })).toBe('/recipes');
    expect(listHref({ query: 'a b', filters: { meal: 'Backen' } })).toBe(
      '/recipes?q=a+b&meal=baking',
    );
    expect(listHref({ query: '', filters: { ratings: [3] }, sort: 'best' })).toBe(
      '/recipes?rating=3&sort=best',
    );
  });
});

describe('countActiveFilters', () => {
  it('counts the ratings as one, like the categories', () => {
    expect(countActiveFilters({ ratings: ['unrated', 2, 5] })).toBe(1);
    expect(countActiveFilters({ ratings: [] })).toBe(0);
  });

  it('counts categories as one and ignores the meal', () => {
    expect(countActiveFilters({})).toBe(0);
    expect(countActiveFilters({ meal: 'Backen', categories: [] })).toBe(0);
    expect(countActiveFilters({ categories: ['Suppe', 'Salat'] })).toBe(1);
    expect(
      countActiveFilters({
        categories: ['Suppe'],
        maxTotalMinutes: 30,
        onlyWithInstructions: true,
      }),
    ).toBe(3);
  });
});

describe('toFilterChoices', () => {
  it('names the checked chips', () => {
    expect(toFilterChoices({})).toEqual({
      ratings: [],
      categories: [],
      quick: false,
      withInstructions: false,
    });
    expect(
      toFilterChoices({
        meal: 'Backen',
        categories: ['Suppe', 'Hauptgericht'],
        maxTotalMinutes: 30,
        onlyWithInstructions: true,
        ratings: [4, 'unrated'],
      }),
    ).toEqual({
      ratings: ['unrated', '4'],
      categories: ['main', 'soup'],
      quick: true,
      withInstructions: true,
    });
  });
});
