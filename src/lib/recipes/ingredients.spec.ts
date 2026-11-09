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
    ['8 Scheiben Kassler', 'Scheiben', 'Kassler'],
    ['1 Scheibe Brot', 'Scheibe', 'Brot'],
    ['3 Paar Würstchen', 'Paar', 'Würstchen'],
    ['37 Stiele Basilikum', 'Stiele', 'Basilikum'],
    ['2 Fixpäckchen Gewürz', 'Fixpäckchen', 'Gewürz'],
    ['2 Dosen Tomaten', 'Dosen', 'Tomaten'],
    ['1 Glas Pesto', 'Glas', 'Pesto'],
    ['1 Würfel Hefe', 'Würfel', 'Hefe'],
  ])('splits "%s" into unit and rest', (line, unit, rest) => {
    expect(quantityOf(line)).toMatchObject({ unit, rest });
  });

  it.each([
    ['2 tl Butter', 'TL', 'Butter'],
    ['1 el Öl', 'EL', 'Öl'],
    ['1 L Milch', 'l', 'Milch'],
  ])('shows the unit of "%s" in its usual spelling', (line, unit, rest) => {
    expect(quantityOf(line)).toMatchObject({ unit, rest });
  });

  it.each([
    ['1 kleine Prise Zucker', 'kleine Prise', 'Zucker'],
    ['1 kleines Glas Weißwein', 'kleines Glas', 'Weißwein'],
    ['1 große Dose Mais', 'große Dose', 'Mais'],
  ])('keeps the size word in the unit of "%s"', (line, unit, rest) => {
    expect(quantityOf(line)).toMatchObject({ min: 1, unit, rest });
  });

  it.each([
    ['150ml Milch', 150, 'ml', 'Milch'],
    ['250g Mehl', 250, 'g', 'Mehl'],
    ['1,5EL Zucker', 1.5, 'EL', 'Zucker'],
  ])('reads "%s" without a space before the unit', (line, min, unit, rest) => {
    expect(quantityOf(line)).toEqual({ min, unit, rest });
  });

  it.each([
    ['½ TL Salz', 0.5, 'TL', 'Salz'],
    ['¼ TL Salz', 0.25, 'TL', 'Salz'],
    ['¾ l Milch', 0.75, 'l', 'Milch'],
    ['1/2 TL Salz', 0.5, 'TL', 'Salz'],
    ['1/4 TL Salz', 0.25, 'TL', 'Salz'],
    ['3/4 l Milch', 0.75, 'l', 'Milch'],
    ['1 1/2 TL Salz', 1.5, 'TL', 'Salz'],
    ['1 ½ EL Öl', 1.5, 'EL', 'Öl'],
    ['1½ EL Öl', 1.5, 'EL', 'Öl'],
    ['1/2 Würfel Hefe (21 g)', 0.5, 'Würfel', 'Hefe (21 g)'],
  ])('reads the fraction in "%s"', (line, min, unit, rest) => {
    expect(quantityOf(line)).toEqual({ min, unit, rest });
  });

  it('reads a fraction without a unit', () => {
    expect(quantityOf('1/2 weiße Zwiebel')).toEqual({ min: 0.5, rest: 'weiße Zwiebel' });
  });

  it('reads fractions in a range', () => {
    expect(quantityOf('½–1 TL Chili')).toMatchObject({ min: 0.5, max: 1, unit: 'TL' });
    expect(quantityOf('2–3 ½ EL Öl')).toMatchObject({ min: 2, max: 3.5, unit: 'EL' });
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
    '1.5 EL Zucker',
    '⅓ TL Salz',
    '1/3 TL Salz',
    '1 1/3 TL Salz',
    '1 ⅓ EL Öl',
    '2–3 ⅓ EL Öl',
    'Topping: 1/2 TL Kokosöl',
  ])('leaves "%s" without a quantity', (line) => {
    expect(parseIngredients(line)).toEqual([{ kind: 'item', text: line }]);
  });
});
