import { describe, expect, it } from 'vitest';
import { recipeRowMeta } from './recipe-row-meta.ts';

const complete = { hasInstructions: true, totalMinutes: 65, workMinutes: 20, servings: 4 };

describe('recipeRowMeta', () => {
  it('shows total time and servings', () => {
    expect(recipeRowMeta(complete)).toBe('1 Std. 5 Min. · 4 Portionen');
  });

  it('falls back to the work time without a total time', () => {
    expect(recipeRowMeta({ ...complete, totalMinutes: undefined })).toBe('20 Min. · 4 Portionen');
  });

  it('uses the singular for one serving', () => {
    expect(recipeRowMeta({ ...complete, servings: 1 })).toBe('1 Std. 5 Min. · 1 Portion');
  });

  it('writes fractional servings with a decimal comma', () => {
    expect(recipeRowMeta({ ...complete, servings: 2.5 })).toBe('1 Std. 5 Min. · 2,5 Portionen');
    expect(recipeRowMeta({ ...complete, servings: 0.5 })).toBe('1 Std. 5 Min. · 0,5 Portionen');
  });

  it('prefers the total time over the work time', () => {
    expect(recipeRowMeta({ ...complete, totalMinutes: 30, workMinutes: 90 })).toBe(
      '30 Min. · 4 Portionen',
    );
  });

  it('leaves out what is missing', () => {
    const noTime = { hasInstructions: true, servings: 2 };
    expect(recipeRowMeta(noTime)).toBe('2 Portionen');
    expect(recipeRowMeta({ ...complete, servings: undefined })).toBe('1 Std. 5 Min.');
    expect(recipeRowMeta({ hasInstructions: true })).toBe('');
  });

  it('says so for a recipe without instructions, whatever else is known', () => {
    expect(recipeRowMeta({ ...complete, hasInstructions: false })).toBe('Noch ohne Anleitung');
  });
});
