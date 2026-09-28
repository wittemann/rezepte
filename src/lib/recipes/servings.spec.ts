import { describe, expect, it } from 'vitest';
import type { Quantity } from './ingredients.ts';
import {
  formatAmount,
  formatQuantity,
  nextServings,
  previousServings,
  scaleAmount,
  scaleQuantity,
  servingsFactor,
} from './servings.ts';

describe('servingsFactor', () => {
  it('divides the chosen by the base servings', () => {
    expect(servingsFactor(2, 4)).toBe(0.5);
    expect(servingsFactor(6, 4)).toBe(1.5);
    expect(servingsFactor(4, 4)).toBe(1);
  });
});

describe('nextServings and previousServings', () => {
  it.each([
    [0.5, 1],
    [1, 1.5],
    [1.5, 2],
    [2, 3],
    [4, 5],
    [2.5, 3.5],
  ])('goes up from %s to %s', (servings, next) => {
    expect(nextServings(servings)).toBe(next);
  });

  it.each([
    [5, 4],
    [3, 2],
    [2, 1.5],
    [1, 0.5],
    [0.5, 0.5],
    [2.5, 2],
  ])('goes down from %s to %s, never below ½', (servings, previous) => {
    expect(previousServings(servings)).toBe(previous);
  });
});

describe('scaleAmount', () => {
  it('keeps the amount exactly as written for factor 1', () => {
    expect(scaleAmount(0.3, 1)).toBe(0.3);
    expect(scaleAmount(22.5, 1)).toBe(22.5);
  });

  it('rounds to whole numbers from 20 on', () => {
    expect(scaleAmount(250, 0.75)).toBe(188); // 187.5
    expect(scaleAmount(15, 1.5)).toBe(23); // 22.5
  });

  it('rounds to ¼ below 20', () => {
    expect(scaleAmount(1, 1.5)).toBe(1.5);
    expect(scaleAmount(1, 1 / 3)).toBe(0.25); // 0.33
    expect(scaleAmount(2, 2 / 3)).toBe(1.25); // 1.33
    expect(scaleAmount(13, 1.5)).toBe(19.5);
  });

  it('keeps tiny amounts to one decimal instead of rounding them to 0', () => {
    expect(scaleAmount(0.3, 0.25)).toBe(0.1); // 0.075
    expect(scaleAmount(0.1, 0.5)).toBe(0.1); // 0.05, at least 0.1
  });
});

describe('scaleQuantity', () => {
  const quantity: Quantity = { min: 2, max: 3, unit: 'EL', prefix: 'ca.', rest: 'Öl' };

  it('scales min and max and keeps the rest', () => {
    expect(scaleQuantity(quantity, 0.5)).toEqual({
      min: 1,
      max: 1.5,
      unit: 'EL',
      prefix: 'ca.',
      rest: 'Öl',
    });
  });

  it('drops the max when the range rounds to one amount', () => {
    expect(scaleQuantity({ min: 1, max: 1.2, rest: 'Ei' }, 0.5)).toEqual({ min: 0.5, rest: 'Ei' });
  });

  it('does not change the given quantity', () => {
    scaleQuantity(quantity, 2);
    expect(quantity.min).toBe(2);
  });
});

describe('formatAmount', () => {
  it.each([
    [250, '250'],
    [1, '1'],
    [0.25, '¼'],
    [0.5, '½'],
    [0.75, '¾'],
    [1.5, '1½'],
    [19.75, '19¾'],
    [0.3, '0,3'],
    [22.5, '22½'],
    [22.3, '22,3'],
    [0.1 + 0.2, '0,3'],
  ])('formats %s as "%s"', (amount, text) => {
    expect(formatAmount(amount)).toBe(text);
  });
});

describe('formatQuantity', () => {
  it.each<[Quantity, string]>([
    [{ min: 250, unit: 'g', rest: 'Mehl' }, '250 g'],
    [{ min: 2, rest: 'Eier' }, '2'],
    [{ min: 1.5, max: 2, unit: 'EL', prefix: 'ca.', rest: 'Öl' }, 'ca. 1½–2 EL'],
    [{ min: 0.5, max: 1, unit: 'TL', rest: 'Chili' }, '½–1 TL'],
  ])('formats the amount column of %j as "%s"', (quantity, text) => {
    expect(formatQuantity(quantity)).toBe(text);
  });
});
