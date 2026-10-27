import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { RECIPE_FIELDS } from './fields.ts';
import {
  forgetMemoryCopy,
  forgetTable,
  putRecord,
  readTable,
  REFRESH_AFTER_MS,
  reloadTable,
  removeRecord,
} from './table-copy.ts';
import {
  backgroundWorkDone,
  makeRuntimeCacheUnavailable,
  resetRuntimeCache,
  runtimeCache,
} from './test-runtime-cache.ts';

vi.mock('@vercel/functions', () => import('./test-runtime-cache.ts'));
vi.mock('../monitoring.ts', () => ({ reportError: vi.fn(), reportWarning: vi.fn() }));

const SHARED_KEY = 'recipe-table:appTestBase';

const titled = (id: string, title: string) => ({
  id,
  createdTime: '2026-09-27T10:00:00.000Z',
  fields: { [RECIPE_FIELDS.title]: title },
});

function table(...titles: string[]) {
  const records = titles.map((title, index) => titled(`rec${index}`, title));
  return new Response(JSON.stringify({ records }));
}

function serverError() {
  return new Response(JSON.stringify({ error: 'ERROR' }), { status: 500 });
}

/** A connection whose fetch returns `responses` in order. */
function connectionAnswering(...responses: Response[]) {
  const fetch = vi.fn<typeof globalThis.fetch>();
  for (const response of responses) fetch.mockResolvedValueOnce(response);
  const connection = { token: 'patTestToken', baseId: 'appTestBase', fetch, delay: async () => {} };
  return { connection, fetch };
}

const titlesOf = (records: { fields: Record<string, unknown> }[]) =>
  records.map((record) => record.fields[RECIPE_FIELDS.title]);

let warn: MockInstance<typeof console.warn>;
beforeEach(() => {
  vi.useFakeTimers();
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  forgetMemoryCopy();
  resetRuntimeCache();
});
afterEach(() => {
  warn.mockRestore();
  vi.useRealTimers();
});

describe('readTable', () => {
  it('loads the table once and keeps it in memory and in the Runtime Cache', async () => {
    const { connection, fetch } = connectionAnswering(table('Testsuppe'));

    expect(titlesOf(await readTable(connection))).toEqual(['Testsuppe']);
    expect(titlesOf(await readTable(connection))).toEqual(['Testsuppe']);

    expect(fetch).toHaveBeenCalledOnce();
    expect(runtimeCache.get(SHARED_KEY)).toMatchObject({ loadedAt: Date.now() });
  });

  it('shares one load between reads that arrive at the same time', async () => {
    const { connection, fetch } = connectionAnswering(table('Testsuppe'));
    await Promise.all([readTable(connection), readTable(connection)]);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('takes the copy from the Runtime Cache after a cold start, without asking Airtable', async () => {
    const { connection, fetch } = connectionAnswering(table('Testsuppe'));
    await readTable(connection);

    forgetMemoryCopy(); // a new server instance
    expect(titlesOf(await readTable(connection))).toEqual(['Testsuppe']);

    expect(fetch).toHaveBeenCalledOnce();
  });

  it('answers from an old copy at once and reloads it in the background', async () => {
    const { connection, fetch } = connectionAnswering(table('Alt'), table('Neu'));
    await readTable(connection);

    vi.advanceTimersByTime(REFRESH_AFTER_MS - 1);
    await readTable(connection);
    expect(fetch).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(1);
    expect(titlesOf(await readTable(connection))).toEqual(['Alt']);
    await backgroundWorkDone();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(titlesOf(await readTable(connection))).toEqual(['Neu']);
    forgetMemoryCopy();
    expect(titlesOf(await readTable(connection))).toEqual(['Neu']); // also in the Runtime Cache
  });

  it('starts only one background reload at a time', async () => {
    const { connection, fetch } = connectionAnswering(table('Alt'), table('Neu'));
    await readTable(connection);
    vi.advanceTimersByTime(REFRESH_AFTER_MS);

    await Promise.all([readTable(connection), readTable(connection)]);
    await backgroundWorkDone();

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('takes a newer copy that another instance stored instead of asking Airtable', async () => {
    const { connection, fetch } = connectionAnswering(table('Alt'));
    await readTable(connection);
    vi.advanceTimersByTime(REFRESH_AFTER_MS);
    runtimeCache.set(SHARED_KEY, { loadedAt: Date.now(), records: [titled('recB', 'Neu')] });

    await readTable(connection);
    await backgroundWorkDone();

    expect(fetch).toHaveBeenCalledOnce();
    expect(titlesOf(await readTable(connection))).toEqual(['Neu']);
  });

  it('keeps the old copy when the background reload fails', async () => {
    const { connection } = connectionAnswering(table('Alt'), serverError());
    await readTable(connection);
    vi.advanceTimersByTime(REFRESH_AFTER_MS);

    await readTable(connection);
    await backgroundWorkDone();

    expect(titlesOf(await readTable(connection))).toEqual(['Alt']);
  });

  it('loads the table again after a failed load', async () => {
    const { connection, fetch } = connectionAnswering(serverError(), table('Testsuppe'));

    await expect(readTable(connection)).rejects.toMatchObject({ status: 500 });
    expect(titlesOf(await readTable(connection))).toEqual(['Testsuppe']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('ignores a value in the Runtime Cache that is no table copy', async () => {
    runtimeCache.set(SHARED_KEY, { records: 'kaputt' });
    const { connection, fetch } = connectionAnswering(table('Testsuppe'));

    expect(titlesOf(await readTable(connection))).toEqual(['Testsuppe']);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('still reads from Airtable when the Runtime Cache fails', async () => {
    makeRuntimeCacheUnavailable();
    const { connection } = connectionAnswering(table('Testsuppe'));

    expect(titlesOf(await readTable(connection))).toEqual(['Testsuppe']);
    expect(warn).toHaveBeenCalledTimes(2); // reading and storing the copy
  });

  it('keeps the tables of different bases apart', async () => {
    const { connection, fetch } = connectionAnswering(table('Eins'), table('Zwei'));

    await readTable(connection);
    const other = await readTable({ ...connection, baseId: 'appOtherBase' });

    expect(titlesOf(other)).toEqual(['Zwei']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('forgetTable', () => {
  it('forgets the copy in memory and in the Runtime Cache', async () => {
    const { connection, fetch } = connectionAnswering(table('Alt'), table('Neu'));
    await readTable(connection);

    await forgetTable(connection);

    expect(runtimeCache.has(SHARED_KEY)).toBe(false);
    expect(titlesOf(await readTable(connection))).toEqual(['Neu']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('putRecord', () => {
  it('replaces the record with the same ID, in memory and in the Runtime Cache', async () => {
    const { connection, fetch } = connectionAnswering(table('Alt', 'Andere'));
    await readTable(connection);

    await putRecord(connection, titled('rec0', 'Neu'));

    expect(titlesOf(await readTable(connection))).toEqual(['Neu', 'Andere']);
    forgetMemoryCopy();
    expect(titlesOf(await readTable(connection))).toEqual(['Neu', 'Andere']);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('adds a record that is not in the copy yet', async () => {
    const { connection } = connectionAnswering(table('Eins'));
    await readTable(connection);

    await putRecord(connection, titled('recNew', 'Neu'));

    expect(titlesOf(await readTable(connection))).toEqual(['Eins', 'Neu']);
  });

  it('keeps the age of the copy, so the next reload still happens on time', async () => {
    const { connection, fetch } = connectionAnswering(table('Alt'), table('Neu'));
    await readTable(connection);
    vi.advanceTimersByTime(REFRESH_AFTER_MS);

    await putRecord(connection, titled('rec0', 'Gespeichert'));
    await readTable(connection);
    await backgroundWorkDone();

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does nothing without a copy and never asks Airtable', async () => {
    const { connection, fetch } = connectionAnswering();
    await putRecord(connection, titled('recNew', 'Neu'));
    expect(fetch).not.toHaveBeenCalled();
    expect(runtimeCache.size).toBe(0);
  });

  it('drops a background reload during which a record was saved', async () => {
    const reload = Promise.withResolvers<Response>();
    const { connection, fetch } = connectionAnswering(table('Alt'));
    fetch.mockImplementationOnce(() => reload.promise);
    await readTable(connection);
    vi.advanceTimersByTime(REFRESH_AFTER_MS);

    await readTable(connection); // starts the reload, which waits for Airtable
    await putRecord(connection, titled('rec0', 'Gespeichert'));
    reload.resolve(table('Vor dem Speichern'));
    await backgroundWorkDone();

    expect(titlesOf(await readTable(connection))).toEqual(['Gespeichert']);
  });
});

describe('removeRecord', () => {
  it('takes the record out, in memory and in the Runtime Cache', async () => {
    const { connection, fetch } = connectionAnswering(table('Weg', 'Bleibt'));
    await readTable(connection);

    await removeRecord(connection, 'rec0');

    expect(titlesOf(await readTable(connection))).toEqual(['Bleibt']);
    forgetMemoryCopy();
    expect(titlesOf(await readTable(connection))).toEqual(['Bleibt']);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('does nothing without a copy and never asks Airtable', async () => {
    const { connection, fetch } = connectionAnswering();
    await removeRecord(connection, 'rec0');
    expect(fetch).not.toHaveBeenCalled();
    expect(runtimeCache.size).toBe(0);
  });

  it('drops a background reload during which a record was deleted', async () => {
    const reload = Promise.withResolvers<Response>();
    const { connection, fetch } = connectionAnswering(table('Weg', 'Bleibt'));
    fetch.mockImplementationOnce(() => reload.promise);
    await readTable(connection);
    vi.advanceTimersByTime(REFRESH_AFTER_MS);

    await readTable(connection); // starts the reload, which waits for Airtable
    await removeRecord(connection, 'rec0');
    reload.resolve(table('Weg', 'Bleibt'));
    await backgroundWorkDone();

    expect(titlesOf(await readTable(connection))).toEqual(['Bleibt']);
  });
});

describe('reloadTable', () => {
  it('loads the table right away, also when the copy is new, and replaces it everywhere', async () => {
    const { connection, fetch } = connectionAnswering(table('Alt'), table('Neu'));
    await readTable(connection);

    await reloadTable(connection);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(titlesOf(await readTable(connection))).toEqual(['Neu']);
    forgetMemoryCopy();
    expect(titlesOf(await readTable(connection))).toEqual(['Neu']);
  });

  it('passes Airtable errors on and keeps no broken copy in memory', async () => {
    const { connection, fetch } = connectionAnswering(serverError(), table('Neu'));

    await expect(reloadTable(connection)).rejects.toMatchObject({ status: 500 });
    expect(titlesOf(await readTable(connection))).toEqual(['Neu']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
