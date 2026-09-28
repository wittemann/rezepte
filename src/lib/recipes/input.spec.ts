import { describe, expect, it } from 'vitest';
import { RECIPE_FIELDS } from './fields.ts';
import { recipeInputSchema, toRecordFields, type RecipeInput } from './input.ts';

// Fields in the base that aren't in RECIPE_FIELDS because the app never touches them.
const CALORIES_TOTAL_FIELD_ID = 'fldBz3DRCMbeL1qvF'; // Kalorien gesamt
const RATING_FIELD_ID = 'fldNQWaV85W4mRwgu'; // Meine Bewertung

/** A made-up input with only a title, plus the given fields. */
function testInput(fields: Partial<RecipeInput> = {}): RecipeInput {
  return { title: 'Testsuppe', meals: [], ingredientsText: '', stepsText: '', ...fields };
}

describe('toRecordFields', () => {
  it('maps every field to its field ID, times in seconds', () => {
    const fields = toRecordFields({
      title: 'Testsuppe',
      category: 'Suppe',
      meals: ['Frühstück', 'Mittag & Abend'],
      servings: 4,
      workMinutes: 20,
      totalMinutes: 65,
      ingredientsText: '250 g Testgemüse\nSalz',
      stepsText: '1. Alles 10 Minuten kochen.',
      source: 'Chefkoch',
      sourceUrl: 'https://example.org/testsuppe',
      notes: 'Schmeckt auch kalt.',
    });

    expect(fields).toEqual({
      [RECIPE_FIELDS.title]: 'Testsuppe',
      [RECIPE_FIELDS.category]: 'Suppe',
      [RECIPE_FIELDS.meals]: ['Frühstück', 'Mittag & Abend'],
      [RECIPE_FIELDS.servings]: 4,
      [RECIPE_FIELDS.workTime]: 1200,
      [RECIPE_FIELDS.totalTime]: 3900,
      [RECIPE_FIELDS.ingredients]: '250 g Testgemüse\nSalz',
      [RECIPE_FIELDS.steps]: '1. Alles 10 Minuten kochen.',
      [RECIPE_FIELDS.source]: 'Chefkoch',
      [RECIPE_FIELDS.sourceUrl]: 'https://example.org/testsuppe',
      [RECIPE_FIELDS.notes]: 'Schmeckt auch kalt.',
    });
  });

  it('sends empty fields as null and no meals as [], so an update clears them', () => {
    expect(toRecordFields(testInput())).toEqual({
      [RECIPE_FIELDS.title]: 'Testsuppe',
      [RECIPE_FIELDS.category]: null,
      [RECIPE_FIELDS.meals]: [],
      [RECIPE_FIELDS.servings]: null,
      [RECIPE_FIELDS.workTime]: null,
      [RECIPE_FIELDS.totalTime]: null,
      [RECIPE_FIELDS.ingredients]: null,
      [RECIPE_FIELDS.steps]: null,
      [RECIPE_FIELDS.source]: null,
      [RECIPE_FIELDS.sourceUrl]: null,
      [RECIPE_FIELDS.notes]: null,
    });
  });

  it('writes a time of 0:00 as 0 seconds, not as empty', () => {
    const fields = toRecordFields(testInput({ workMinutes: 0 }));
    expect(fields[RECIPE_FIELDS.workTime]).toBe(0);
  });

  it('never writes calories, rating or images, even if the input has them', () => {
    const input = {
      ...testInput(),
      caloriesPerServing: 320,
      images: [{ id: 'attTest1', url: '/img/recTest1/attTest1' }],
    } as RecipeInput;

    const fieldIds = Object.keys(toRecordFields(input));

    expect(fieldIds).not.toContain(RECIPE_FIELDS.caloriesPerServing);
    expect(fieldIds).not.toContain(RECIPE_FIELDS.images);
    expect(fieldIds).not.toContain(CALORIES_TOTAL_FIELD_ID);
    expect(fieldIds).not.toContain(RATING_FIELD_ID);
    expect(fieldIds).toHaveLength(11); // exactly the writable fields
  });

  it('trims texts and treats blank ones as empty', () => {
    const fields = toRecordFields(
      testInput({
        title: '  Testsuppe ',
        ingredientsText: '\n250 g Testgemüse\n',
        stepsText: '  \n ',
        sourceUrl: '  ',
        notes: ' ',
      }),
    );

    expect(fields).toMatchObject({
      [RECIPE_FIELDS.title]: 'Testsuppe',
      [RECIPE_FIELDS.ingredients]: '250 g Testgemüse',
      [RECIPE_FIELDS.steps]: null,
      [RECIPE_FIELDS.sourceUrl]: null,
      [RECIPE_FIELDS.notes]: null,
    });
  });

  it('throws on invalid input instead of writing it', () => {
    expect(() => toRecordFields(testInput({ title: ' ' }))).toThrow();
  });
});

describe('recipeInputSchema', () => {
  function invalidFields(input: unknown): string[] {
    const result = recipeInputSchema.safeParse(input);
    return result.success ? [] : result.error.issues.map((issue) => String(issue.path[0]));
  }

  it('accepts an input with only a title', () => {
    expect(invalidFields(testInput())).toEqual([]);
  });

  it.each(['', '   '])('rejects the title %j', (title) => {
    expect(invalidFields(testInput({ title }))).toEqual(['title']);
  });

  it('rejects an unknown category, so no new select option is created', () => {
    expect(invalidFields({ ...testInput(), category: 'Testkategorie' })).toEqual(['category']);
  });

  it('rejects an unknown meal, so no new select option is created', () => {
    expect(invalidFields({ ...testInput(), meals: ['Frühstück', 'Brunch'] })).toEqual(['meals']);
  });

  it.each([0, -2, 1.5])('rejects servings of %d', (servings) => {
    expect(invalidFields(testInput({ servings }))).toEqual(['servings']);
  });

  it.each([-5, 1.5])('rejects %d minutes', (minutes) => {
    expect(invalidFields(testInput({ workMinutes: minutes, totalMinutes: minutes }))).toEqual([
      'workMinutes',
      'totalMinutes',
    ]);
  });

  it.each(['javascript:alert(1)', 'ftp://example.org/x', 'kein Link'])(
    'rejects the source URL %s',
    (sourceUrl) => {
      expect(invalidFields(testInput({ sourceUrl }))).toEqual(['sourceUrl']);
    },
  );

  it('rejects an unknown source, which would become a new option in Airtable', () => {
    expect(invalidFields({ ...testInput(), source: 'Chefkoh' })).toEqual(['source']);
  });
});
