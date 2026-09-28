import { describe, expect, it, vi } from 'vitest';
import {
  AirtableError,
  createRecord,
  listRecords,
  listTables,
  RATE_LIMIT_WAIT_MS,
  updateRecord,
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
    expect(init).toEqual({ method: 'GET', headers: { Authorization: `Bearer ${TOKEN}` } });
  });

  it('sends the filter formula on every page', async () => {
    const { connection, fetch } = connectionAnswering(
      jsonResponse({ records: [testRecord('recA')], offset: 'page2' }),
      jsonResponse({ records: [testRecord('recB')] }),
    );
    await listRecords(connection, TABLE_ID, { filterByFormula: "RECORD_ID() = 'recA'" });

    for (const [url] of fetch.mock.calls) {
      expect(new URL(String(url)).searchParams.get('filterByFormula')).toBe("RECORD_ID() = 'recA'");
    }
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

describe('createRecord', () => {
  it('POSTs the fields as JSON, with typecast and fields keyed by ID', async () => {
    const { connection, fetch } = connectionAnswering(jsonResponse(testRecord('recNew')));
    await createRecord(connection, TABLE_ID, { fldTitle: 'Title of recNew' });

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe(TABLE_URL);
    expect(init).toEqual({
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: { fldTitle: 'Title of recNew' },
        typecast: true,
        returnFieldsByFieldId: true,
      }),
    });
  });

  it('returns the saved record', async () => {
    const { connection } = connectionAnswering(jsonResponse(testRecord('recNew')));
    expect(await createRecord(connection, TABLE_ID, {})).toEqual(testRecord('recNew'));
  });

  it('waits and tries once more when rate limited', async () => {
    const { connection, fetch, delay } = connectionAnswering(
      rateLimited(),
      jsonResponse(testRecord('recNew')),
    );

    expect(await createRecord(connection, TABLE_ID, {})).toEqual(testRecord('recNew'));
    expect(delay).toHaveBeenCalledWith(RATE_LIMIT_WAIT_MS);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1]).toEqual(fetch.mock.calls[0]);
  });

  it('names POST in the error', async () => {
    const { connection } = connectionAnswering(
      jsonResponse({ error: { type: 'INVALID_VALUE_FOR_COLUMN', message: 'Bad value' } }, 422),
    );

    await expect(createRecord(connection, TABLE_ID, {})).rejects.toMatchObject({
      status: 422,
      message: `Airtable POST ${TABLE_PATH} failed with 422 (INVALID_VALUE_FOR_COLUMN: Bad value)`,
    });
  });
});

describe('updateRecord', () => {
  it('PATCHes (never PUTs) the fields as JSON, with typecast and fields keyed by ID', async () => {
    const { connection, fetch } = connectionAnswering(jsonResponse(testRecord('recA')));
    await updateRecord(connection, TABLE_ID, 'recA', { fldTitle: 'Title of recA' });

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe(`${TABLE_URL}/recA`);
    expect(init).toEqual({
      method: 'PATCH',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: { fldTitle: 'Title of recA' },
        typecast: true,
        returnFieldsByFieldId: true,
      }),
    });
  });

  it.each(['', '.', '..', 'rec', 'recA/../tblOther', 'recA?x=1', 'tblTestTable'])(
    'refuses "%s" as record ID without sending anything',
    async (recordId) => {
      const { connection, fetch } = connectionAnswering();
      await expect(updateRecord(connection, TABLE_ID, recordId, {})).rejects.toThrow(
        'Not an Airtable record ID',
      );
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it('returns the saved record', async () => {
    const { connection } = connectionAnswering(jsonResponse(testRecord('recA')));
    expect(await updateRecord(connection, TABLE_ID, 'recA', {})).toEqual(testRecord('recA'));
  });

  it('names PATCH in the error, e.g. for an unknown record ID', async () => {
    const { connection } = connectionAnswering(
      jsonResponse({ error: { type: 'INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND' } }, 403),
    );

    await expect(updateRecord(connection, TABLE_ID, 'recUnknown', {})).rejects.toMatchObject({
      status: 403,
      message: `Airtable PATCH ${TABLE_PATH}/recUnknown failed with 403 (INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND)`,
    });
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
