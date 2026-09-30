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
    },
  };

  it('round-trips through parseListQuery', () => {
    expect(parseListQuery(toSearchParams(full))).toEqual(full);
  });

  it('leaves out what is not set', () => {
    expect(listHref({ query: '', filters: {} })).toBe('/rezepte');
    expect(listHref({ query: 'a b', filters: { meal: 'Backen' } })).toBe(
      '/rezepte?q=a+b&meal=baking',
    );
  });
});

describe('countActiveFilters', () => {
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
    expect(toFilterChoices({})).toEqual({ categories: [], quick: false, withInstructions: false });
    expect(
      toFilterChoices({
        meal: 'Backen',
        categories: ['Suppe', 'Hauptgericht'],
        maxTotalMinutes: 30,
        onlyWithInstructions: true,
      }),
    ).toEqual({ categories: ['main', 'soup'], quick: true, withInstructions: true });
  });
});
