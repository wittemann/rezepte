// Thin fetch client for the Airtable Web API (docs/decisions/0002-airtable-as-source-of-truth.md).
// Knows URLs, the auth header, paging and errors, but nothing about recipes.
// Token and base ID are passed in (no astro:env import), so it also works in tests and scripts.

const API_URL = 'https://api.airtable.com/v0';

/** After too many requests (5 per second per base), Airtable answers 429 for 30 seconds. */
export const RATE_LIMIT_WAIT_MS = 30_000;

/** A record as Airtable returns it: `fields` keyed by field ID, empty fields left out. */
export type AirtableRecord = {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
};

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
export type AirtableConnection = {
  token: string;
  baseId: string;
  /** Replaced in tests. */
  fetch?: typeof fetch;
  /** Replaced in tests, so they don't wait 30 seconds. */
  delay?: (ms: number) => Promise<void>;
};

type ListRecordsResponse = {
  records: AirtableRecord[];
  offset?: string; // only while more pages follow
};

// Airtable describes errors as {"error": "NOT_FOUND"} or {"error": {"type": "…", "message": "…"}}.
type ErrorResponse = {
  error?: string | { type?: string; message?: string };
};

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
async function toAirtableError(
  response: Response,
  method: string,
  url: URL,
): Promise<AirtableError> {
  let message = `Airtable ${method} ${url.pathname} failed with ${response.status}`;
  const reason = await readErrorReason(response);
  if (reason) message += ` (${reason})`;
  return new AirtableError(response.status, message);
}

type HttpMethod = 'GET' | 'POST' | 'PATCH';

// Airtable record IDs: "rec" followed by letters and digits.
const RECORD_ID = /^rec[A-Za-z0-9]+$/;

/** Whether `id` looks like an Airtable record ID. Anything else is never sent to Airtable. */
export function isRecordId(id: string): boolean {
  return RECORD_ID.test(id);
}

/**
 * Sends a request to `url` and returns the JSON answer. A `body` is sent as JSON.
 * On 429 it waits once and tries again; any other error status throws.
 */
async function requestJson(
  connection: AirtableConnection,
  method: HttpMethod,
  url: URL,
  body?: unknown,
): Promise<unknown> {
  const { fetch = globalThis.fetch, delay = wait } = connection;
  const headers: Record<string, string> = { Authorization: `Bearer ${connection.token}` };
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let response = await fetch(url, init);
  if (response.status === 429) {
    await delay(RATE_LIMIT_WAIT_MS);
    response = await fetch(url, init);
  }
  if (!response.ok) throw await toAirtableError(response, method, url);
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
    const page = (await requestJson(connection, 'GET', url)) as ListRecordsResponse;
    records.push(...page.records);
    offset = page.offset;
  } while (offset);
  return records;
}

/** A table in the base's schema, with the parts the app looks at. */
export type AirtableTable = {
  id: string;
  name: string;
  primaryFieldId: string;
  fields: { id: string; name: string; type: string }[];
};

/** All tables of the base with their fields (metadata API, needs the `schema.bases:read` scope). */
export async function listTables(connection: AirtableConnection): Promise<AirtableTable[]> {
  const url = new URL(`${API_URL}/meta/bases/${connection.baseId}/tables`);
  const { tables } = (await requestJson(connection, 'GET', url)) as { tables: AirtableTable[] };
  return tables;
}

/**
 * Creates one record and returns it as saved, fields keyed by field ID.
 * `typecast` lets Airtable convert values, e.g. add a missing select option.
 */
export async function createRecord(
  connection: AirtableConnection,
  tableId: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord> {
  const url = new URL(`${API_URL}/${connection.baseId}/${tableId}`);
  const body = { fields, typecast: true, returnFieldsByFieldId: true };
  return (await requestJson(connection, 'POST', url, body)) as AirtableRecord;
}

/**
 * Changes only the given fields of one record (PATCH; PUT would clear all others)
 * and returns it as saved, fields keyed by field ID.
 *
 * Throws before sending anything if `recordId` isn't a record ID ("..", "recA/x"), so it can't
 * point the request at another URL.
 *
 * Note: for an unknown record ID Airtable answers 403 INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND,
 * not 404 (seen live for GET and PATCH). Callers have to handle that.
 */
export async function updateRecord(
  connection: AirtableConnection,
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord> {
  if (!isRecordId(recordId)) throw new Error(`Not an Airtable record ID: ${recordId}`);
  const url = new URL(`${API_URL}/${connection.baseId}/${tableId}/${recordId}`);
  const body = { fields, typecast: true, returnFieldsByFieldId: true };
  return (await requestJson(connection, 'PATCH', url, body)) as AirtableRecord;
}
