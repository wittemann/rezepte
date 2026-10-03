import { describe, expect, it } from 'vitest';
import { RECIPE_FIELDS } from './fields.ts';
import { imageUrl, readRecord } from './record.ts';

const CREATED = '2026-09-27T10:00:00.000Z';

/** A made-up record with the given fields (keyed by domain name) and a title. */
function testRecord(fields: Partial<Record<keyof typeof RECIPE_FIELDS, unknown>>) {
  const byFieldId: Record<string, unknown> = { [RECIPE_FIELDS.title]: 'Testsuppe' };
  for (const [name, value] of Object.entries(fields)) {
    byFieldId[RECIPE_FIELDS[name as keyof typeof RECIPE_FIELDS]] = value;
  }
  return { id: 'recTest1', createdTime: CREATED, fields: byFieldId };
}

describe('readRecord', () => {
  it('reads a record with only a title', () => {
    expect(readRecord(testRecord({}))).toEqual({
      recipe: {
        id: 'recTest1',
        title: 'Testsuppe',
        meals: [],
        ingredientsText: '',
        stepsText: '',
        ingredients: [],
        method: { sections: [] },
        hasInstructions: false,
        images: [],
        createdAt: CREATED,
      },
      invalidFields: [],
    });
  });

  it('reads all fields and parses the texts', () => {
    const { recipe, invalidFields } = readRecord(
      testRecord({
        category: 'Suppe',
        meals: ['Mittag & Abend'],
        servings: 4,
        workTime: 1200, // seconds
        totalTime: 3900,
        ingredients: '250 g Testgemüse\nSalz',
        steps: '1. Alles 10 Minuten kochen.',
        caloriesPerServing: 320,
        source: 'Testquelle',
        sourceUrl: 'https://example.org/testsuppe',
        notes: 'Schmeckt auch kalt.',
        favoritedAt: '2026-10-01T08:30:00.000Z',
      }),
    );

    expect(invalidFields).toEqual([]);
    expect(recipe).toMatchObject({
      category: 'Suppe',
      meals: ['Mittag & Abend'],
      servings: 4,
      workMinutes: 20,
      totalMinutes: 65,
      caloriesPerServing: 320,
      ingredientsText: '250 g Testgemüse\nSalz',
      stepsText: '1. Alles 10 Minuten kochen.',
      ingredients: [
        {
          kind: 'item',
          text: '250 g Testgemüse',
          quantity: { min: 250, unit: 'g', rest: 'Testgemüse' },
        },
        { kind: 'item', text: 'Salz' },
      ],
      method: { sections: [{ steps: [{ text: 'Alles 10 Minuten kochen.' }] }] },
      hasInstructions: true,
      source: 'Testquelle',
      sourceUrl: 'https://example.org/testsuppe',
      notes: 'Schmeckt auch kalt.',
      favoritedAt: '2026-10-01T08:30:00.000Z',
    });
  });

  it('leaves out an invalid "Favorit seit" and keeps the recipe', () => {
    const { recipe, invalidFields } = readRecord(testRecord({ favoritedAt: 'gestern' }));
    expect(invalidFields).toEqual(['favoritedAt']);
    expect(recipe?.favoritedAt).toBeUndefined();
  });

  it('trims the title', () => {
    expect(readRecord(testRecord({ title: '  Testsuppe ' })).recipe?.title).toBe('Testsuppe');
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['only spaces', '   '],
    ['not text', 42],
  ])('gives no recipe when the title is %s', (_, title) => {
    expect(readRecord(testRecord({ title }))).toEqual({ invalidFields: ['title'] });
  });

  it('leaves out fields with a wrong shape and keeps the rest', () => {
    const { recipe, invalidFields } = readRecord(
      testRecord({ servings: 'vier', meals: 'Frühstück', notes: 'Bleibt.' }),
    );

    expect(invalidFields).toEqual(['meals', 'servings']);
    expect(recipe?.servings).toBeUndefined();
    expect(recipe?.meals).toEqual([]);
    expect(recipe?.notes).toBe('Bleibt.');
  });

  it('reports servings of 0, which the scaler cannot use', () => {
    const { recipe, invalidFields } = readRecord(testRecord({ servings: 0 }));
    expect(invalidFields).toEqual(['servings']);
    expect(recipe?.servings).toBeUndefined();
  });

  it('keeps an unknown category and leaves out unknown meals', () => {
    const { recipe, invalidFields } = readRecord(
      testRecord({ category: 'Testkategorie', meals: ['Frühstück', 'Brunch'] }),
    );
    expect(invalidFields).toEqual([]);
    expect(recipe?.category).toBe('Testkategorie');
    expect(recipe?.meals).toEqual(['Frühstück']);
  });

  it('leaves out and reports a formula error in the calories', () => {
    const { recipe, invalidFields } = readRecord(
      testRecord({ caloriesPerServing: { specialValue: 'NaN' } }),
    );
    expect(invalidFields).toEqual(['caloriesPerServing']);
    expect(recipe?.caloriesPerServing).toBeUndefined();
  });

  it.each(['javascript:alert(1)', 'ftp://example.org/x', 'kein Link'])(
    'leaves out the source URL %s',
    (sourceUrl) => {
      const { recipe, invalidFields } = readRecord(testRecord({ sourceUrl }));
      expect(invalidFields).toEqual(['sourceUrl']);
      expect(recipe?.sourceUrl).toBeUndefined();
    },
  );

  it('treats empty or blank steps as a stub', () => {
    expect(readRecord(testRecord({ steps: ' \n ' })).recipe?.hasInstructions).toBe(false);
  });

  it('turns image attachments into app-internal URLs', () => {
    const { recipe } = readRecord(
      testRecord({
        images: [
          {
            id: 'attPhoto1',
            url: 'https://airtable.example/expiring/photo.jpg',
            filename: 'photo.jpg',
            type: 'image/jpeg',
            width: 1200,
            height: 900,
            thumbnails: { small: { url: 'https://airtable.example/small.jpg' } },
          },
          { id: 'attPdf', url: 'https://airtable.example/x.pdf', type: 'application/pdf' },
        ],
      }),
    );

    expect(recipe?.images).toEqual([
      { id: 'attPhoto1', url: '/img/recTest1/attPhoto1', width: 1200, height: 900 },
    ]);
  });

  it('reports attachments without an ID', () => {
    const { recipe, invalidFields } = readRecord(testRecord({ images: [{ type: 'image/png' }] }));
    expect(invalidFields).toEqual(['images']);
    expect(recipe?.images).toEqual([]);
  });
});

describe('imageUrl', () => {
  it('keeps each ID in its own path segment', () => {
    expect(imageUrl('recA', 'att/../x')).toBe('/img/recA/att%2F..%2Fx');
  });
});
