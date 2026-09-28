// Thin fetch client for the Airtable Web API (docs/decisions/0002-airtable-as-source-of-truth.md).
// Knows URLs, the auth header, paging and errors, but nothing about recipes.
// Token and base ID are passed in (no astro:env import), so it also works in tests and scripts.

const API_URL = 'https://api.airtable.com/v0';

/** After too many requests (5 per second per base), Airtable answers 429 for 30 seconds. */
export const RATE_LIMIT_WAIT_MS = 30_000;

/** A record as Airtable returns it: `fields` keyed by field ID, empty fields left out. */
export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
}

/** Airtable answered with an error status, e.g. 404 or 429. */
export class AirtableError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AirtableError';
    this.status = status;
  }
}

/** Which base to talk to and how. Every call takes one of these. */
export interface AirtableConnection {
  token: string;
  baseId: string;
  /** Replaced in tests. */
  fetch?: typeof fetch;
  /** Replaced in tests, so they don't wait 30 seconds. */
  delay?: (ms: number) => Promise<void>;
}

interface ListRecordsResponse {
  records: AirtableRecord[];
  offset?: string; // only while more pages follow
}

// Airtable describes errors as {"error": "NOT_FOUND"} or {"error": {"type": "…", "message": "…"}}.
interface ErrorResponse {
  error?: string | { type?: string; message?: string };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Airtable's error type and message, if the response has them. */
async function readErrorReason(response: Response): Promise<string | undefined> {
  try {
    const { error } = (await response.json()) as ErrorResponse;
    if (typeof error === 'string') return error;
    if (error?.type && error.message) return `${error.type}: ${error.message}`;
    return error?.type;
  } catch {
    return undefined; // not JSON, e.g. an HTML error page during an outage
  }
}

/** An AirtableError that says which request failed and why. */
async function toAirtableError(response: Response, url: URL): Promise<AirtableError> {
  let message = `Airtable GET ${url.pathname} failed with ${response.status}`;
  const reason = await readErrorReason(response);
  if (reason) message += ` (${reason})`;
  return new AirtableError(response.status, message);
}

/** GETs `url` as JSON. On 429 it waits once and tries again; any other error status throws. */
async function getJson(connection: AirtableConnection, url: URL): Promise<unknown> {
  const { fetch = globalThis.fetch, delay = wait } = connection;
  const init = { headers: { Authorization: `Bearer ${connection.token}` } };

  let response = await fetch(url, init);
  if (response.status === 429) {
    await delay(RATE_LIMIT_WAIT_MS);
    response = await fetch(url, init);
  }
  if (!response.ok) throw await toAirtableError(response, url);
  return response.json();
}

/**
 * All records of a table, or only those matching `filterByFormula` (an Airtable formula).
 * Airtable sends up to 100 per page, plus an offset for the next one.
 */
export async function listRecords(
  connection: AirtableConnection,
  tableId: string,
  options: { filterByFormula?: string } = {},
): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`${API_URL}/${connection.baseId}/${tableId}`);
    url.searchParams.set('returnFieldsByFieldId', 'true');
    if (options.filterByFormula) url.searchParams.set('filterByFormula', options.filterByFormula);
    if (offset) url.searchParams.set('offset', offset);
    const page = (await getJson(connection, url)) as ListRecordsResponse;
    records.push(...page.records);
    offset = page.offset;
  } while (offset);
  return records;
}

/** A table in the base's schema, with the parts the app looks at. */
export interface AirtableTable {
  id: string;
  name: string;
  primaryFieldId: string;
  fields: { id: string; name: string; type: string }[];
}

/** All tables of the base with their fields (metadata API, needs the `schema.bases:read` scope). */
export async function listTables(connection: AirtableConnection): Promise<AirtableTable[]> {
  const url = new URL(`${API_URL}/meta/bases/${connection.baseId}/tables`);
  const { tables } = (await getJson(connection, url)) as { tables: AirtableTable[] };
  return tables;
}
