import { describe, expect, it } from 'vitest';
import { parseIngredients } from '../recipes/ingredients.ts';
import { toBringItems } from './items.ts';

const lines = (...text: string[]) => parseIngredients(text.join('\n'));

describe('toBringItems', () => {
  it('puts amount and unit into the specification, the rest into the name', () => {
    expect(toBringItems(lines('250 g Mehl', '3 Eier'), 1)).toEqual([
      { name: 'Mehl', specification: '250 g' },
      { name: 'Eier', specification: '3' },
    ]);
  });

  it('scales the amounts by the factor, rounded like on the recipe page', () => {
    expect(toBringItems(lines('250 g Mehl', '1 EL Zucker', '2–3 Zwiebeln'), 1.5)).toEqual([
      { name: 'Mehl', specification: '375 g' },
      { name: 'Zucker', specification: '1½ EL' },
      { name: 'Zwiebeln', specification: '3–4½' },
    ]);
  });

  it('keeps the prefix in the specification', () => {
    expect(toBringItems(lines('ca. 200 ml Sahne'), 1)).toEqual([
      { name: 'Sahne', specification: 'ca. 200 ml' },
    ]);
  });

  it('sends lines without a readable amount whole as the name', () => {
    expect(toBringItems(lines('Salz, Pfeffer', '½ TL Zimt'), 2)).toEqual([
      { name: 'Salz, Pfeffer' },
      { name: '½ TL Zimt' },
    ]);
  });

  it('uses the whole line when only an amount is written', () => {
    expect(toBringItems(lines('3'), 1)).toEqual([{ name: '3' }]);
  });

  it('leaves out headings', () => {
    expect(toBringItems(lines('Für den Teig:', '200 g Mehl'), 1)).toEqual([
      { name: 'Mehl', specification: '200 g' },
    ]);
  });
});
