import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { AirtableRecord } from '../airtable/client.ts';
import { RECIPE_FIELDS, RECIPES_TABLE_ID } from './fields.ts';
import { getAll, getById } from './repository.ts';

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
