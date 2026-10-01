import { describe, expect, it } from 'vitest';
import { recipeMetaStickers } from './recipe-meta-stickers.ts';

describe('recipeMetaStickers', () => {
  it('gives work time, total time and calories, in this order', () => {
    expect(
      recipeMetaStickers({ workMinutes: 35, totalMinutes: 195, caloriesPerServing: 292 }),
    ).toEqual([
      { label: 'Arbeitszeit', value: '35 Min.' },
      { label: 'Gesamtzeit', value: '3 Std. 15 Min.' },
      { label: 'pro Portion', value: '292 kcal' },
    ]);
  });

  it('leaves out what the recipe does not have', () => {
    expect(recipeMetaStickers({ totalMinutes: 20 })).toEqual([
      { label: 'Gesamtzeit', value: '20 Min.' },
    ]);
    expect(recipeMetaStickers({})).toEqual([]);
  });

  it('rounds the calories to whole numbers', () => {
    expect(recipeMetaStickers({ caloriesPerServing: 291.6 })[0].value).toBe('292 kcal');
  });
});
