import { describe, expect, it } from 'vitest';
import { parseIngredients } from './ingredients.ts';
import { parseMethod } from './method.ts';
import { buildShareText } from './share-text.ts';
import { makeRecipe } from './test-recipe.ts';

describe('buildShareText', () => {
  it('puts all parts in order, a blank line between them', () => {
    const recipe = makeRecipe({
      title: 'Beispielrezept A',
      servings: 4,
      workMinutes: 20,
      totalMinutes: 65,
      caloriesPerServing: 500,
      rating: 5,
      ingredients: parseIngredients('250 g Mehl\n2 Eier'),
      method: parseMethod('1. Mehl sieben.\n2. Eier unterrühren.'),
      notes: 'Schmeckt auch kalt.',
      source: 'Chefkoch',
      sourceUrl: 'https://example.test/rezept',
    });
    expect(buildShareText(recipe)).toBe(
      [
        'Beispielrezept A',
        '4 Portionen · Arbeitszeit 20 Min. · Gesamtzeit 1 Std. 5 Min.',
        '',
        'Zutaten',
        '- 250 g Mehl',
        '- 2 Eier',
        '',
        'Zubereitung',
        '1. Mehl sieben.',
        '2. Eier unterrühren.',
        '',
        'Notizen',
        'Schmeckt auch kalt.',
        '',
        'Quelle: Chefkoch',
        'https://example.test/rezept',
      ].join('\n'),
    );
  });

  it('is just the title when nothing else is set', () => {
    expect(buildShareText(makeRecipe({ title: 'Beispielrezept A' }))).toBe('Beispielrezept A');
  });

  it('shows only the facts that are set', () => {
    const text = buildShareText(makeRecipe({ totalMinutes: 30 }));
    expect(text).toBe('Beispielrezept A\nGesamtzeit 30 Min.');
  });

  it.each([
    [1, '1 Portion'],
    [0.5, '½ Portion'],
    [2, '2 Portionen'],
  ])('writes %s servings as "%s"', (servings, expected) => {
    expect(buildShareText(makeRecipe({ servings }))).toBe(`Beispielrezept A\n${expected}`);
  });

  it('keeps the ingredient lines as written, not scaled', () => {
    const recipe = makeRecipe({
      servings: 2,
      ingredients: parseIngredients('ca. 1,5 EL Öl\n1 1/2 TL Salz\nPfeffer'),
    });
    expect(buildShareText(recipe)).toContain('- ca. 1,5 EL Öl\n- 1 1/2 TL Salz\n- Pfeffer');
  });

  it('puts ingredient headings on their own line after a blank line', () => {
    const recipe = makeRecipe({
      ingredients: parseIngredients('Für den Teig:\n250 g Mehl\nZum Servieren:\nSahne'),
    });
    expect(buildShareText(recipe)).toContain(
      'Zutaten\n\nFür den Teig:\n- 250 g Mehl\n\nZum Servieren:\n- Sahne',
    );
  });

  it('numbers the steps through all sections and adds the hint', () => {
    const recipe = makeRecipe({
      method: parseMethod(
        'Teig:\n1. Kneten.\n2. Ruhen lassen.\nFüllung:\n3. Mischen.\n\nTipp: Am Vortag backen.',
      ),
    });
    expect(buildShareText(recipe)).toContain(
      'Zubereitung\n\nTeig:\n1. Kneten.\n2. Ruhen lassen.\n\nFüllung:\n3. Mischen.\n\nTipp: Am Vortag backen.',
    );
  });

  it('leaves out the steps of an idea (no instructions)', () => {
    const recipe = makeRecipe({
      hasInstructions: false,
      ingredients: parseIngredients('250 g Mehl'),
      method: parseMethod('1. Mehl sieben.'),
      sourceUrl: 'https://example.test/rezept',
    });
    expect(buildShareText(recipe)).toBe(
      'Beispielrezept A\n\nZutaten\n- 250 g Mehl\n\nQuelle: https://example.test/rezept',
    );
  });

  it('leaves out "Zubereitung" when there are no steps', () => {
    expect(buildShareText(makeRecipe({ method: { sections: [] } }))).not.toContain('Zubereitung');
  });

  it('leaves out notes that are only whitespace and trims the rest', () => {
    expect(buildShareText(makeRecipe({ notes: '  \n ' }))).toBe('Beispielrezept A');
    expect(buildShareText(makeRecipe({ notes: '\nZeile eins\nZeile zwei\n' }))).toBe(
      'Beispielrezept A\n\nNotizen\nZeile eins\nZeile zwei',
    );
  });

  it('writes the source name alone when there is no link', () => {
    expect(buildShareText(makeRecipe({ source: 'Apple Notes' }))).toBe(
      'Beispielrezept A\n\nQuelle: Apple Notes',
    );
  });
});
