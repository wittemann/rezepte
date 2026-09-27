import { describe, expect, it, vi } from 'vitest';
import {
  AirtableError,
  listRecords,
  listTables,
  RATE_LIMIT_WAIT_MS,
  type AirtableRecord,
} from './client.ts';

const TOKEN = 'patTestToken.notARealOne';
const TABLE_ID = 'tblTestTable';
const TABLE_URL = 'https://api.airtable.com/v0/appTestBase/tblTestTable';
const TABLE_PATH = '/v0/appTestBase/tblTestTable';

function testRecord(id: string): AirtableRecord {
  return { id, createdTime: '2026-09-27T10:00:00.000Z', fields: { fldTitle: `Title of ${id}` } };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

const rateLimited = () =>
  jsonResponse({ error: { type: 'RATE_LIMIT_REACHED', message: 'Rate limit exceeded.' } }, 429);

/** A connection whose fetch returns `responses` in order and whose delay returns right away. */
function connectionAnswering(...responses: Response[]) {
  const fetch = vi.fn<typeof globalThis.fetch>();
  for (const response of responses) fetch.mockResolvedValueOnce(response);
  const delay = vi.fn(async () => {});
  const connection = { token: TOKEN, baseId: 'appTestBase', fetch, delay };
  return { connection, fetch, delay };
}

describe('listRecords', () => {
  it('asks for the table with the token, fields keyed by ID', async () => {
    const { connection, fetch } = connectionAnswering(jsonResponse({ records: [] }));
    await listRecords(connection, TABLE_ID);

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe(`${TABLE_URL}?returnFieldsByFieldId=true`);
    expect(init).toEqual({ headers: { Authorization: `Bearer ${TOKEN}` } });
  });

  it('returns the records of a single page', async () => {
    const records = [testRecord('recA'), testRecord('recB')];
    const { connection } = connectionAnswering(jsonResponse({ records }));
    expect(await listRecords(connection, TABLE_ID)).toEqual(records);
  });

  it('follows the offset until the last page', async () => {
    const { connection, fetch } = connectionAnswering(
      jsonResponse({ records: [testRecord('recA')], offset: 'itrPage2/recB' }),
      jsonResponse({ records: [testRecord('recB')], offset: 'itrPage3/recC' }),
      jsonResponse({ records: [testRecord('recC')] }),
    );

    expect(await listRecords(connection, TABLE_ID)).toEqual([
      testRecord('recA'),
      testRecord('recB'),
      testRecord('recC'),
    ]);
    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([
      `${TABLE_URL}?returnFieldsByFieldId=true`,
      `${TABLE_URL}?returnFieldsByFieldId=true&offset=itrPage2%2FrecB`,
      `${TABLE_URL}?returnFieldsByFieldId=true&offset=itrPage3%2FrecC`,
    ]);
  });
});

describe('rate limit (429)', () => {
  it('waits 30 seconds and tries once more', async () => {
    const records = [testRecord('recA')];
    const { connection, fetch, delay } = connectionAnswering(
      rateLimited(),
      jsonResponse({ records }),
    );

    expect(await listRecords(connection, TABLE_ID)).toEqual(records);
    expect(delay).toHaveBeenCalledOnce();
    expect(delay).toHaveBeenCalledWith(RATE_LIMIT_WAIT_MS);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('gives up when the second try is limited too', async () => {
    const { connection, fetch, delay } = connectionAnswering(rateLimited(), rateLimited());

    await expect(listRecords(connection, TABLE_ID)).rejects.toMatchObject({
      status: 429,
      message: `Airtable GET ${TABLE_PATH} failed with 429 (RATE_LIMIT_REACHED: Rate limit exceeded.)`,
    });
    expect(delay).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('errors', () => {
  it.each([
    [404, { error: 'NOT_FOUND' }, '404 (NOT_FOUND)'],
    [403, { error: { type: 'INVALID_PERMISSIONS' } }, '403 (INVALID_PERMISSIONS)'],
    [
      422,
      { error: { type: 'INVALID_REQUEST', message: 'Bad offset' } },
      '422 (INVALID_REQUEST: Bad offset)',
    ],
    [401, {}, '401'],
  ])('turns %i %j into an AirtableError', async (status, body, description) => {
    const { connection } = connectionAnswering(jsonResponse(body, status));
    const listing = listRecords(connection, TABLE_ID);

    await expect(listing).rejects.toBeInstanceOf(AirtableError);
    await expect(listing).rejects.toMatchObject({
      status,
      message: `Airtable GET ${TABLE_PATH} failed with ${description}`,
    });
  });

  it('copes with an error page that is not JSON, and does not retry it', async () => {
    const { connection, fetch, delay } = connectionAnswering(
      new Response('<html>Bad Gateway</html>', { status: 502 }),
    );

    await expect(listRecords(connection, TABLE_ID)).rejects.toMatchObject({
      status: 502,
      message: `Airtable GET ${TABLE_PATH} failed with 502`,
    });
    expect(fetch).toHaveBeenCalledOnce();
    expect(delay).not.toHaveBeenCalled();
  });
});

describe('listTables', () => {
  it('reads the schema of the base', async () => {
    const tables = [
      {
        id: 'tblTestTable',
        name: 'Test',
        primaryFieldId: 'fldTitle',
        fields: [{ id: 'fldTitle', name: 'Title', type: 'singleLineText' }],
      },
    ];
    const { connection, fetch } = connectionAnswering(jsonResponse({ tables }));

    expect(await listTables(connection)).toEqual(tables);
    expect(String(fetch.mock.calls[0][0])).toBe(
      'https://api.airtable.com/v0/meta/bases/appTestBase/tables',
    );
  });
});
