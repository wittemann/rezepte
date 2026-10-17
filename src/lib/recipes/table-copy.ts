// The copy of the recipe table that all reads use (docs/decisions/0003-rendering-and-caching.md).
// It lives in the memory of this server instance and in the Vercel Runtime Cache, which all
// instances of a region share and which outlives cold starts. Reads never wait for Airtable when
// there is a copy; a copy older than REFRESH_AFTER_MS is reloaded after the response.
// Outside Vercel (local dev, tests) getCache() falls back to memory and waitUntil does nothing.

import { getCache, waitUntil } from '@vercel/functions';
import { listRecords, type AirtableConnection, type AirtableRecord } from '../airtable/client.ts';
import { RECIPES_TABLE_ID } from './fields.ts';

/** How old the copy may get before it's reloaded in the background. */
export const REFRESH_AFTER_MS = 10 * 60 * 1000;

// Unused copies drop out of the Runtime Cache after this long; the next read then loads the table.
const SHARED_COPY_TTL_SECONDS = 30 * 24 * 60 * 60;

type TableCopy = { loadedAt: number; records: AirtableRecord[] };

// On Hobby all projects of the team share one Runtime Cache, hence the namespace.
const sharedCache = getCache({ namespace: 'rezepte' });

// The copy in this instance's memory. Holds the promise, so requests arriving while it loads
// (e.g. a burst of /img requests) share one load.
let memoryCopy: { baseId: string; copy: Promise<TableCopy> } | undefined;

// The background reload running in this instance, if any; there is never more than one.
let refreshing: Promise<void> | undefined;

// Counts saved records, so a reload that started before a save doesn't overwrite it
let saveCount = 0;

/** All records of the recipe table, from the copy if there is one. */
export async function readTable(connection: AirtableConnection) {
  const copy = await currentCopy(connection);
  if (Date.now() - copy.loadedAt >= REFRESH_AFTER_MS) refreshInBackground(connection, copy);
  return copy.records;
}

/**
 * Puts a record Airtable just saved into the copy, replacing the one with its ID, so the change
 * shows up at once without reloading the table. Without a copy there is nothing to update: the
 * next read loads the table, change included. The copy keeps its age, so changes made directly
 * in Airtable still show up with the next reload.
 */
export async function putRecord(connection: AirtableConnection, record: AirtableRecord) {
  saveCount++;
  const copy = await existingCopy(connection);
  if (!copy) return;

  const isKnown = copy.records.some((existing) => existing.id === record.id);
  const records = isKnown
    ? copy.records.map((existing) => (existing.id === record.id ? record : existing))
    : [...copy.records, record];
  const updated = { loadedAt: copy.loadedAt, records };

  memoryCopy = { baseId: connection.baseId, copy: Promise.resolve(updated) };
  await storeSharedCopy(connection, updated);
}

/**
 * Loads the table from Airtable right now and replaces the copy, e.g. after recipes were changed
 * directly in Airtable. Waits for Airtable, unlike the reload in the background.
 */
export async function reloadTable(connection: AirtableConnection) {
  const copy = loadTable(connection);
  memoryCopy = { baseId: connection.baseId, copy };
  const loaded = await copy.catch((error: unknown) => {
    if (memoryCopy?.copy === copy) memoryCopy = undefined;
    throw error;
  });
  await storeSharedCopy(connection, loaded);
}

/** Forgets the copy in memory and in the Runtime Cache, so the next read loads the table. */
export async function forgetTable(connection: AirtableConnection) {
  memoryCopy = undefined;
  try {
    await sharedCache.delete(sharedKey(connection));
  } catch (error) {
    console.warn('Runtime Cache: deleting the recipe table failed', error);
  }
}

/** Forgets the copy in memory only. For tests, which start every case without a copy. */
export function forgetMemoryCopy() {
  memoryCopy = undefined;
  refreshing = undefined;
  saveCount = 0;
}

function currentCopy(connection: AirtableConnection) {
  if (memoryCopy?.baseId === connection.baseId) return memoryCopy.copy;

  const copy = readSharedCopy(connection).then(async (shared) => {
    if (shared) return shared;
    const loaded = await loadTable(connection);
    await storeSharedCopy(connection, loaded);
    return loaded;
  });
  memoryCopy = { baseId: connection.baseId, copy };
  // A failed load isn't kept: the next request tries again
  copy.catch(() => {
    if (memoryCopy?.copy === copy) memoryCopy = undefined;
  });
  return copy;
}

/**
 * Replaces an old copy without making anyone wait. Another instance may have reloaded the table
 * already: then its copy is taken from the Runtime Cache instead of asking Airtable again.
 * A failed reload keeps the old copy (the Airtable client has reported the error), and so does a
 * reload during which a record was saved: it may not contain that change yet.
 */
function refreshInBackground(connection: AirtableConnection, oldCopy: TableCopy) {
  if (refreshing) return;
  const baseId = connection.baseId;
  const savesBefore = saveCount;
  refreshing = (async () => {
    const shared = await readSharedCopy(connection);
    const isNewer = shared && shared.loadedAt > oldCopy.loadedAt;
    const fresh = isNewer && Date.now() - shared.loadedAt < REFRESH_AFTER_MS;
    const copy = fresh ? shared : await loadTable(connection);
    if (saveCount !== savesBefore) return;
    if (!fresh) await storeSharedCopy(connection, copy);
    if (memoryCopy?.baseId === baseId) memoryCopy = { baseId, copy: Promise.resolve(copy) };
  })()
    .catch(() => {})
    .finally(() => {
      refreshing = undefined;
    });
  // Keeps the function alive on Vercel until the reload is done
  waitUntil(refreshing);
}

/** Loads the whole table from Airtable. */
async function loadTable(connection: AirtableConnection) {
  const records = await listRecords(connection, RECIPES_TABLE_ID);
  const copy: TableCopy = { loadedAt: Date.now(), records };
  return copy;
}

/** The copy in memory or in the Runtime Cache, or undefined. Never asks Airtable. */
async function existingCopy(connection: AirtableConnection) {
  if (memoryCopy?.baseId === connection.baseId) {
    return memoryCopy.copy.catch(() => undefined);
  }
  return readSharedCopy(connection);
}

async function storeSharedCopy(connection: AirtableConnection, copy: TableCopy) {
  try {
    await sharedCache.set(sharedKey(connection), copy, { ttl: SHARED_COPY_TTL_SECONDS });
  } catch (error) {
    console.warn('Runtime Cache: storing the recipe table failed', error);
  }
}

/** The copy in the Runtime Cache, or undefined if there is none or it can't be read. */
async function readSharedCopy(connection: AirtableConnection) {
  try {
    const value = await sharedCache.get(sharedKey(connection));
    return isTableCopy(value) ? value : undefined;
  } catch (error) {
    console.warn('Runtime Cache: reading the recipe table failed', error);
    return undefined;
  }
}

function sharedKey(connection: AirtableConnection) {
  return `recipe-table:${connection.baseId}`;
}

function isTableCopy(value: unknown): value is TableCopy {
  if (typeof value !== 'object' || value === null) return false;
  const { loadedAt, records } = value as Partial<TableCopy>;
  return typeof loadedAt === 'number' && Array.isArray(records);
}
