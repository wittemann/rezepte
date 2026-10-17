// Reads and writes recipes in Airtable as domain Recipes
// (docs/decisions/0002-airtable-as-source-of-truth.md, docs/specs/03-data-model.md).
// The connection is passed in, like in lib/airtable/client.ts, so tests and scripts can use it.
// Writes send only the fields from toRecordFields (input.ts), never computed ones.
// Reads come from a copy of the recipe table (table-copy.ts, docs/decisions/0003-rendering-and-caching.md).

import {
  createRecord,
  getRecord,
  isRecordId,
  updateRecord,
  uploadAttachment,
  type AirtableConnection,
  type AirtableRecord,
} from '../airtable/client.ts';
import { reportWarning } from '../monitoring.ts';
import { RECIPE_FIELDS, RECIPES_TABLE_ID } from './fields.ts';
import { findImageUrl, type ImageSize } from './image-source.ts';
import { toRecordFields, type RecipeInput } from './input.ts';
import type { Recipe, RecipeId } from './recipe.ts';
import { readRecord } from './record.ts';
import { forgetTable, putRecord, readTable } from './table-copy.ts';

const byTitle = new Intl.Collator('de').compare;

/**
 * Runs a write and puts the saved record into the table copy. A failed write may have changed
 * the record halfway, so then the copy is forgotten and the next read loads the table.
 */
async function saving(connection: AirtableConnection, write: () => Promise<AirtableRecord>) {
  let record: AirtableRecord;
  try {
    record = await write();
  } catch (error) {
    await forgetTable(connection);
    throw error;
  }
  await putRecord(connection, record);
  return record;
}

/** All recipes that can be read, sorted by title (German order: "Äpfel" next to "Apfel"). */
export async function getAll(connection: AirtableConnection) {
  const records = await readTable(connection);
  const recipes: Recipe[] = [];
  for (const record of records) {
    const recipe = readAndReport(record);
    if (recipe) recipes.push(recipe); // records without a title are skipped
  }
  return recipes.sort((first, second) => byTitle(first.title, second.title));
}

/** One recipe, or undefined if there is none with this ID or it has no title (→ 404 page). */
export async function getById(connection: AirtableConnection, id: RecipeId) {
  const record = await findRecord(connection, id);
  return record ? readAndReport(record) : undefined;
}

/** Saves a new recipe and returns it as Airtable saved it. Throws a ZodError for invalid input. */
export async function create(connection: AirtableConnection, input: RecipeInput) {
  const fields = toRecordFields(input);
  const record = await saving(connection, () => createRecord(connection, RECIPES_TABLE_ID, fields));
  return readSavedRecord(record);
}

/**
 * Changes a recipe (PATCH: all writable fields, nothing else) and returns it as saved,
 * or undefined if there is no recipe with this ID. Throws a ZodError for invalid input.
 */
export async function update(connection: AirtableConnection, id: RecipeId, input: RecipeInput) {
  if (!isRecordId(id)) return undefined;
  const fields = toRecordFields(input); // before any request, so invalid input sends nothing
  // Checked first: a PATCH with an unknown ID answers 403, which must stay a real permission error.
  // This also makes sure the record is in the recipe table (Airtable finds record IDs across all
  // tables of a base).
  if (!(await findRecord(connection, id))) return undefined;
  const record = await saving(connection, () =>
    updateRecord(connection, RECIPES_TABLE_ID, id, fields),
  );
  return readSavedRecord(record);
}

/**
 * Marks a recipe as favorite (sets "Favorit seit" to `now`) or not (clears it) and returns it as
 * saved, or undefined if there is no recipe with this ID. Writes only that field, so it never
 * touches the rest of the recipe. Marking an existing favorite again moves it to the front.
 */
export async function setFavorite(
  connection: AirtableConnection,
  id: RecipeId,
  favorite: boolean,
  now: Date = new Date(),
) {
  if (!(await findRecord(connection, id))) return undefined; // same reason as in update()
  const fields = { [RECIPE_FIELDS.favoritedAt]: favorite ? now.toISOString() : null };
  const record = await saving(connection, () =>
    updateRecord(connection, RECIPES_TABLE_ID, id, fields),
  );
  return readSavedRecord(record);
}

/**
 * Adds a JPEG (base64 text) to the photos of a recipe. Returns false if there is no recipe with
 * this ID. Writes only the photo field, and keeps the photos that are already there.
 */
export async function addPhoto(connection: AirtableConnection, id: RecipeId, base64: string) {
  if (!(await findRecord(connection, id))) return false; // same reason as in update()
  const file = { contentType: 'image/jpeg', filename: 'foto.jpg', base64 };
  await saving(connection, async () => {
    await uploadAttachment(connection, id, RECIPE_FIELDS.images, file);
    // The upload answers with the photo field only, and Airtable's docs don't say whether that
    // lists all photos or just the new one. The whole record is one call and leaves no doubt.
    return getRecord(connection, RECIPES_TABLE_ID, id);
  });
  return true;
}

/**
 * The Airtable URL of one image of a recipe from the table copy, or undefined if the recipe or the
 * image doesn't exist. It may have expired already (see refreshImageUrl): never store it.
 */
export async function getImageUrl(
  connection: AirtableConnection,
  recipeId: RecipeId,
  attachmentId: string,
  size: ImageSize,
) {
  const record = await findRecord(connection, recipeId);
  return record ? findImageUrl(record.fields, attachmentId, size) : undefined;
}

/**
 * Like getImageUrl, but reads the recipe again from Airtable (one call) and puts it into the
 * table copy. For a URL from the copy that no longer works: Airtable's URLs expire after a few
 * hours, and the copy can be older than that.
 */
export async function refreshImageUrl(
  connection: AirtableConnection,
  recipeId: RecipeId,
  attachmentId: string,
  size: ImageSize,
) {
  // Only for a recipe in the copy: Airtable answers an unknown ID with 403 (see update())
  if (!(await findRecord(connection, recipeId))) return undefined;
  const record = await getRecord(connection, RECIPES_TABLE_ID, recipeId);
  await putRecord(connection, record);
  return findImageUrl(record.fields, attachmentId, size);
}

/**
 * The record with this ID in the (cached) recipe table, or undefined. Looking it up in the table
 * instead of GET …/{id} also avoids Airtable's 403 for unknown IDs, which looks like a permission
 * problem.
 */
async function findRecord(connection: AirtableConnection, id: RecipeId) {
  if (!isRecordId(id)) return undefined; // can't be a recipe, so no need to load anything
  const records = await readTable(connection);
  return records.find((record) => record.id === id);
}

// A just-saved record always has a title (toRecordFields requires one), so not reading it is a bug.
function readSavedRecord(record: AirtableRecord) {
  const recipe = readAndReport(record);
  if (!recipe) throw new Error(`Saved recipe record ${record.id} could not be read`);
  return recipe;
}

function readAndReport(record: AirtableRecord) {
  const { recipe, invalidFields } = readRecord(record);
  if (invalidFields.length > 0) reportInvalidRecord(record.id, invalidFields, recipe === undefined);
  return recipe;
}

// Messages already reported to Sentry by this server instance. The list is read on every page
// load, so without this one bad record would use up the monthly event quota.
const reportedMessages = new Set<string>();

// Logged every time (on the server, console.warn also goes to Sentry Logs), and reported as a
// Sentry warning once per instance, which makes an issue (and an email) per record and problem.
// See docs/decisions/0009-error-monitoring.md.
function reportInvalidRecord(recordId: string, invalidFields: string[], skipped: boolean) {
  const outcome = skipped ? 'skipped' : 'fields left out';
  const message = `Recipe record ${recordId}: ${outcome} (invalid: ${invalidFields.join(', ')})`;
  console.warn(message);
  if (reportedMessages.has(message)) return;
  reportedMessages.add(message);
  reportWarning(message, {
    'recipe.record_id': recordId,
    'recipe.invalid_fields': invalidFields.join(','),
    'recipe.outcome': outcome,
  });
}
