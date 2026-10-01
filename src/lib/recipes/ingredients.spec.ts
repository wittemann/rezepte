import { describe, expect, it } from 'vitest';
import { parseIngredients } from './ingredients.ts';

/** The quantity parsed from a single line. */
function quantityOf(line: string) {
  const [parsed] = parseIngredients(line);
  return parsed.kind === 'item' ? parsed.quantity : undefined;
}

describe('parseIngredients', () => {
  it('returns no lines for empty or missing text', () => {
    expect(parseIngredients(undefined)).toEqual([]);
    expect(parseIngredients('')).toEqual([]);
    expect(parseIngredients(' \n\n  ')).toEqual([]);
  });

  it('splits lines, trims them and skips blank ones', () => {
    const lines = parseIngredients('Für den Teig:\n  250 g Mehl \n\nSalz, Pfeffer\n');
    expect(lines).toEqual([
      { kind: 'heading', text: 'Für den Teig' },
      { kind: 'item', text: '250 g Mehl', quantity: { min: 250, unit: 'g', rest: 'Mehl' } },
      { kind: 'item', text: 'Salz, Pfeffer' },
    ]);
  });

  it('treats a line ending in ":" as a heading, even with a number in it', () => {
    expect(parseIngredients('Für 12 Stück:')).toEqual([{ kind: 'heading', text: 'Für 12 Stück' }]);
  });

  it.each([
    ['2 Eier', 2],
    ['1,5 EL Zucker', 1.5],
    ['0,5 TL Salz', 0.5],
  ])('reads the amount of "%s"', (line, min) => {
    expect(quantityOf(line)?.min).toBe(min);
  });

  it.each([
    ['2–3 Zehen Knoblauch', 2, 3],
    ['2-3 Zehen Knoblauch', 2, 3],
    ['2 – 3 Zehen Knoblauch', 2, 3],
    ['0,5–1 TL Chili', 0.5, 1],
  ])('reads the range "%s"', (line, min, max) => {
    expect(quantityOf(line)).toMatchObject({ min, max });
  });

  it.each(['ca.', 'knapp', 'etwa'])('keeps the prefix "%s"', (prefix) => {
    expect(quantityOf(`${prefix} 200 g Kartoffeln`)).toEqual({
      min: 200,
      unit: 'g',
      prefix,
      rest: 'Kartoffeln',
    });
  });

  it.each([
    ['250 g Mehl (Type 550)', 'g', 'Mehl (Type 550)'],
    ['1 Päckchen Vanillezucker', 'Päckchen', 'Vanillezucker'],
    ['1 Prise Salz', 'Prise', 'Salz'],
    ['2 Prisen Salz', 'Prisen', 'Salz'],
    ['0,5 Topf Basilikum', 'Topf', 'Basilikum'],
    ['1 Bund', 'Bund', ''],
  ])('splits "%s" into unit and rest', (line, unit, rest) => {
    expect(quantityOf(line)).toMatchObject({ unit, rest });
  });

  it.each([
    ['2 große Eier', 'große Eier'],
    ['1 lauwarmes Wasser', 'lauwarmes Wasser'],
    ['3 Eier', 'Eier'],
    ['2 Zehen Knoblauch', 'Zehen Knoblauch'],
    ['3', ''],
  ])('does not mistake the start of a word for a unit in "%s"', (line, rest) => {
    expect(quantityOf(line)).toEqual({ min: Number.parseInt(line), rest });
  });

  it.each([
    'Salz, Pfeffer',
    'etwas Butter',
    'ca. eine Handvoll Nüsse',
    '3er Pack Joghurt',
    '250g Mehl',
    '½ TL Salz',
    '1/2 TL Salz',
    '1.5 EL Zucker',
  ])('leaves "%s" without a quantity', (line) => {
    expect(parseIngredients(line)).toEqual([{ kind: 'item', text: line }]);
  });
});
