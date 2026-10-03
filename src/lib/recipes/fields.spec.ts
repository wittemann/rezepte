import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { IconName } from '../../components/Icon.tsx';
import { CATEGORIES, categoryName, MEALS, mealValue, RECIPE_FIELDS } from './fields.ts';

const tokens = readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8');

describe('RECIPE_FIELDS', () => {
  it('holds Airtable field IDs, each used once', () => {
    const ids = Object.values(RECIPE_FIELDS);
    for (const id of ids) expect(id).toMatch(/^fld[A-Za-z0-9]{14}$/);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('CATEGORIES', () => {
  it.each(CATEGORIES)('$value has a pastel color token ($name)', ({ name }) => {
    expect(tokens).toContain(`--pastel-cat-${name}:`);
  });

  it('has an icon for every category', () => {
    // Fails the type check if a name has no icon
    const iconNames: IconName[] = CATEGORIES.map((category) => category.name);
    expect(iconNames).toHaveLength(8);
  });
});

describe('MEALS', () => {
  it.each(MEALS)('$value has a pastel color token ($name)', ({ name }) => {
    expect(tokens).toContain(`--pastel-meal-${name}:`);
  });
});

describe('categoryName', () => {
  it('maps known categories and falls back to "other"', () => {
    expect(categoryName('Suppe')).toBe('soup');
    expect(categoryName('Etwas Neues')).toBe('other');
    expect(categoryName(undefined)).toBe('other');
  });
});

describe('mealValue', () => {
  it('maps the English name to the Airtable value', () => {
    expect(mealValue('breakfast')).toBe('Frühstück');
    expect(mealValue('baking')).toBe('Backen');
  });
});
