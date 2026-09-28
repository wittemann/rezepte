import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { ZodError } from 'zod';
import type { AirtableRecord } from '../airtable/client.ts';
import { RECIPE_FIELDS, RECIPES_TABLE_ID } from './fields.ts';
import { toRecordFields, type RecipeInput } from './input.ts';
import { create, getAll, getById, update } from './repository.ts';

const TABLE_URL = `https://api.airtable.com/v0/appTestBase/${RECIPES_TABLE_ID}`;

function testRecord(id: string, fields: Record<string, unknown>): AirtableRecord {
  return { id, createdTime: '2026-09-27T10:00:00.000Z', fields };
}

const titled = (id: string, title: string) => testRecord(id, { [RECIPE_FIELDS.title]: title });

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

/** A connection whose fetch returns `responses` in order. */
function connectionAnswering(...responses: Response[]) {
  const fetch = vi.fn<typeof globalThis.fetch>();
  for (const response of responses) fetch.mockResolvedValueOnce(response);
  const connection = { token: 'patTestToken', baseId: 'appTestBase', fetch, delay: async () => {} };
  return { connection, fetch };
}

let warn: MockInstance<typeof console.warn>;
beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warn.mockRestore();
});

describe('getAll', () => {
  it('reads the recipe table and sorts by title in German order', async () => {
    const { connection, fetch } = connectionAnswering(
      jsonResponse({
        records: [
          titled('recC', 'Zwetschgentest'),
          titled('recA', 'Äpfeltest'),
          titled('recB', 'Apfeltest'),
          titled('recD', 'bohnentest'),
        ],
      }),
    );

    const recipes = await getAll(connection);

    expect(recipes.map((recipe) => recipe.title)).toEqual([
      'Apfeltest',
      'Äpfeltest',
      'bohnentest',
      'Zwetschgentest',
    ]);
    expect(String(fetch.mock.calls[0][0])).toBe(`${TABLE_URL}?returnFieldsByFieldId=true`);
    expect(warn).not.toHaveBeenCalled();
  });

  it('skips and logs records without a title', async () => {
    const { connection } = connectionAnswering(
      jsonResponse({ records: [titled('recA', 'Testsuppe'), testRecord('recEmpty', {})] }),
    );

    expect((await getAll(connection)).map((recipe) => recipe.id)).toEqual(['recA']);
    expect(warn).toHaveBeenCalledWith('Recipe record recEmpty: skipped (invalid: title)');
  });

  it('keeps and logs records with an invalid field', async () => {
    const { connection } = connectionAnswering(
      jsonResponse({
        records: [
          testRecord('recA', { [RECIPE_FIELDS.title]: 'Testsuppe', [RECIPE_FIELDS.servings]: -1 }),
        ],
      }),
    );

    const [recipe] = await getAll(connection);
    expect(recipe.servings).toBeUndefined();
    expect(warn).toHaveBeenCalledWith('Recipe record recA: fields left out (invalid: servings)');
  });

  it('passes Airtable errors on', async () => {
    const { connection } = connectionAnswering(jsonResponse({ error: 'NOT_FOUND' }, 404));
    await expect(getAll(connection)).rejects.toMatchObject({ status: 404 });
  });
});

describe('getById', () => {
  it('reads one record through a filtered list', async () => {
    const { connection, fetch } = connectionAnswering(
      jsonResponse({ records: [titled('recA', 'Testsuppe')] }),
    );

    expect(await getById(connection, 'recA')).toMatchObject({ id: 'recA', title: 'Testsuppe' });
    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe(TABLE_URL);
    expect(url.searchParams.get('filterByFormula')).toBe("RECORD_ID() = 'recA'");
  });

  it('returns undefined for a missing record', async () => {
    const { connection } = connectionAnswering(jsonResponse({ records: [] }));
    expect(await getById(connection, 'recMissing')).toBeUndefined();
  });

  it('returns undefined without asking Airtable when the ID is no record ID', async () => {
    const { connection, fetch } = connectionAnswering();

    for (const id of ['', 'abc', 'rec', 'recA/../x', 'recA?x=1']) {
      expect(await getById(connection, id)).toBeUndefined();
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns undefined and logs a record without a title', async () => {
    const { connection } = connectionAnswering(
      jsonResponse({ records: [testRecord('recEmpty', {})] }),
    );

    expect(await getById(connection, 'recEmpty')).toBeUndefined();
    expect(warn).toHaveBeenCalledWith('Recipe record recEmpty: skipped (invalid: title)');
  });

  it('passes Airtable errors on, including 403', async () => {
    for (const status of [403, 500]) {
      const { connection } = connectionAnswering(jsonResponse({ error: 'ERROR' }, status));
      await expect(getById(connection, 'recA')).rejects.toMatchObject({ status });
    }
  });
});

/** A made-up input with a few fields filled. */
const testInput: RecipeInput = {
  title: 'Testsuppe',
  category: 'Suppe',
  meals: ['Mittag & Abend'],
  servings: 4,
  workMinutes: 20,
  ingredientsText: '250 g Testgemüse',
  stepsText: '1. Alles kochen.',
};

// Invalid on purpose: a blank title.
const invalidInput: RecipeInput = { ...testInput, title: '  ' };

/** The record Airtable would send back after saving `testInput`. */
const savedRecord = (id: string) =>
  testRecord(id, {
    [RECIPE_FIELDS.title]: 'Testsuppe',
    [RECIPE_FIELDS.category]: 'Suppe',
    [RECIPE_FIELDS.meals]: ['Mittag & Abend'],
    [RECIPE_FIELDS.servings]: 4,
    [RECIPE_FIELDS.workTime]: 1200,
    [RECIPE_FIELDS.ingredients]: '250 g Testgemüse',
    [RECIPE_FIELDS.steps]: '1. Alles kochen.',
    [RECIPE_FIELDS.caloriesPerServing]: 320, // formula, filled in by Airtable
  });

type FetchMock = ReturnType<typeof connectionAnswering>['fetch'];

function requestAt(fetch: FetchMock, index: number) {
  const [url, init] = fetch.mock.calls[index];
  return { url: new URL(String(url)), method: init?.method, body: JSON.parse(String(init?.body)) };
}

describe('create', () => {
  it('posts exactly the mapped fields with typecast and returns the saved recipe', async () => {
    const { connection, fetch } = connectionAnswering(jsonResponse(savedRecord('recNew')));

    const recipe = await create(connection, testInput);

    expect(fetch).toHaveBeenCalledTimes(1);
    const request = requestAt(fetch, 0);
    expect(request.method).toBe('POST');
    expect(request.url.href).toBe(TABLE_URL);
    expect(request.body).toEqual({
      fields: toRecordFields(testInput),
      typecast: true,
      returnFieldsByFieldId: true,
    });
    expect(recipe).toMatchObject({
      id: 'recNew',
      title: 'Testsuppe',
      category: 'Suppe',
      meals: ['Mittag & Abend'],
      servings: 4,
      workMinutes: 20,
      caloriesPerServing: 320,
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('sends nothing for invalid input', async () => {
    const { connection, fetch } = connectionAnswering();
    await expect(create(connection, invalidInput)).rejects.toBeInstanceOf(ZodError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('throws if the saved record has no title', async () => {
    const { connection } = connectionAnswering(jsonResponse(testRecord('recNew', {})));
    await expect(create(connection, testInput)).rejects.toThrow(
      'Saved recipe record recNew could not be read',
    );
  });

  it('passes Airtable errors on', async () => {
    for (const status of [403, 500]) {
      const { connection } = connectionAnswering(jsonResponse({ error: 'ERROR' }, status));
      await expect(create(connection, testInput)).rejects.toMatchObject({ status });
    }
  });
});

describe('update', () => {
  it('checks the record exists, then patches exactly the mapped fields', async () => {
    const { connection, fetch } = connectionAnswering(
      jsonResponse({ records: [titled('recA', 'Alter Testtitel')] }),
      jsonResponse(savedRecord('recA')),
    );

    const recipe = await update(connection, 'recA', testInput);

    expect(fetch).toHaveBeenCalledTimes(2);
    const [lookupUrl, lookupInit] = fetch.mock.calls[0];
    const lookup = new URL(String(lookupUrl));
    expect(lookupInit?.method).toBe('GET');
    expect(lookup.origin + lookup.pathname).toBe(TABLE_URL);
    expect(lookup.searchParams.get('filterByFormula')).toBe("RECORD_ID() = 'recA'");

    const patch = requestAt(fetch, 1);
    expect(patch.method).toBe('PATCH');
    expect(patch.url.href).toBe(`${TABLE_URL}/recA`);
    expect(patch.body).toEqual({
      fields: toRecordFields(testInput),
      typecast: true,
      returnFieldsByFieldId: true,
    });
    expect(recipe).toMatchObject({ id: 'recA', title: 'Testsuppe', servings: 4 });
  });

  it('sends nothing for invalid input', async () => {
    const { connection, fetch } = connectionAnswering();
    await expect(update(connection, 'recA', invalidInput)).rejects.toBeInstanceOf(ZodError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns undefined without asking Airtable when the ID is no record ID', async () => {
    const { connection, fetch } = connectionAnswering();

    for (const id of ['', 'abc', 'rec', 'recA/../x', 'recA?x=1']) {
      expect(await update(connection, id, testInput)).toBeUndefined();
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns undefined for an unknown record and does not patch', async () => {
    const { connection, fetch } = connectionAnswering(jsonResponse({ records: [] }));

    expect(await update(connection, 'recMissing', testInput)).toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1]?.method).toBe('GET');
  });

  it('passes errors of the lookup on, including 403, and does not patch', async () => {
    for (const status of [403, 500]) {
      const { connection, fetch } = connectionAnswering(jsonResponse({ error: 'ERROR' }, status));
      await expect(update(connection, 'recA', testInput)).rejects.toMatchObject({ status });
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  });

  it('passes errors of the PATCH on, including 403', async () => {
    for (const status of [403, 500]) {
      const { connection } = connectionAnswering(
        jsonResponse({ records: [titled('recA', 'Testsuppe')] }),
        jsonResponse({ error: 'ERROR' }, status),
      );
      await expect(update(connection, 'recA', testInput)).rejects.toMatchObject({ status });
    }
  });

  it('throws if the saved record has no title', async () => {
    const { connection } = connectionAnswering(
      jsonResponse({ records: [titled('recA', 'Testsuppe')] }),
      jsonResponse(testRecord('recA', {})),
    );
    await expect(update(connection, 'recA', testInput)).rejects.toThrow(
      'Saved recipe record recA could not be read',
    );
  });
});
