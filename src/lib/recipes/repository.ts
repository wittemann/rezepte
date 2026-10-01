// Reads and writes recipes in Airtable as domain Recipes
// (docs/decisions/0002-airtable-as-source-of-truth.md, docs/specs/03-data-model.md).
// The connection is passed in, like in lib/airtable/client.ts, so tests and scripts can use it.
// Writes send only the fields from toRecordFields (input.ts), never computed ones.

import {
  createRecord,
  isRecordId,
  listRecords,
  updateRecord,
  type AirtableConnection,
  type AirtableRecord,
} from '../airtable/client.ts';
import { RECIPE_FIELDS, RECIPES_TABLE_ID } from './fields.ts';
import { toRecordFields, type RecipeInput } from './input.ts';
import type { Recipe, RecipeId } from './recipe.ts';
import { readRecord } from './record.ts';

const byTitle = new Intl.Collator('de').compare;

/** All recipes that can be read, sorted by title (German order: "Äpfel" next to "Apfel"). */
export async function getAll(connection: AirtableConnection): Promise<Recipe[]> {
  const records = await listRecords(connection, RECIPES_TABLE_ID);
  const recipes: Recipe[] = [];
  for (const record of records) {
    const recipe = readAndReport(record);
    if (recipe) recipes.push(recipe); // records without a title are skipped
  }
  return recipes.sort((first, second) => byTitle(first.title, second.title));
}

/** One recipe, or undefined if there is none with this ID or it has no title (→ 404 page). */
export async function getById(
  connection: AirtableConnection,
  id: RecipeId,
): Promise<Recipe | undefined> {
  const record = await findRecord(connection, id);
  return record ? readAndReport(record) : undefined;
}

/** Saves a new recipe and returns it as Airtable saved it. Throws a ZodError for invalid input. */
export async function create(connection: AirtableConnection, input: RecipeInput): Promise<Recipe> {
  const fields = toRecordFields(input);
  const record = await createRecord(connection, RECIPES_TABLE_ID, fields);
  return readSavedRecord(record);
}

/**
 * Changes a recipe (PATCH: all writable fields, nothing else) and returns it as saved,
 * or undefined if there is no recipe with this ID. Throws a ZodError for invalid input.
 */
export async function update(
  connection: AirtableConnection,
  id: RecipeId,
  input: RecipeInput,
): Promise<Recipe | undefined> {
  if (!isRecordId(id)) return undefined;
  const fields = toRecordFields(input); // before any request, so invalid input sends nothing
  // Checked first, at the cost of one extra request: a PATCH with an unknown ID answers 403, which
  // must stay a real permission error. This also makes sure the record is in the recipe table
  // (Airtable finds record IDs across all tables of a base).
  if (!(await findRecord(connection, id))) return undefined;
  const record = await updateRecord(connection, RECIPES_TABLE_ID, id, fields);
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
  const record = await updateRecord(connection, RECIPES_TABLE_ID, id, fields);
  return readSavedRecord(record);
}

/** The record with this ID in the recipe table, or undefined. */
async function findRecord(
  connection: AirtableConnection,
  id: RecipeId,
): Promise<AirtableRecord | undefined> {
  // Anything that isn't a record ID can't be a recipe; checking it also keeps the formula safe.
  if (!isRecordId(id)) return undefined;
  // A filtered list instead of GET …/{id}: for an unknown ID, that answers 403 (not 404), which
  // looks like a permission problem. The list is simply empty, and a 403 stays a real error.
  const [record] = await listRecords(connection, RECIPES_TABLE_ID, {
    filterByFormula: `RECORD_ID() = '${id}'`,
  });
  return record;
}

// A just-saved record always has a title (toRecordFields requires one), so not reading it is a bug.
function readSavedRecord(record: AirtableRecord): Recipe {
  const recipe = readAndReport(record);
  if (!recipe) throw new Error(`Saved recipe record ${record.id} could not be read`);
  return recipe;
}

function readAndReport(record: AirtableRecord): Recipe | undefined {
  const { recipe, invalidFields } = readRecord(record);
  if (invalidFields.length > 0) reportInvalidRecord(record.id, invalidFields, recipe === undefined);
  return recipe;
}

// A plain log for now; Sentry (warning level, tagged with record ID and fields) replaces it
// later, see docs/decisions/0009-error-monitoring.md.
function reportInvalidRecord(recordId: string, invalidFields: string[], skipped: boolean): void {
  const outcome = skipped ? 'skipped' : 'fields left out';
  console.warn(`Recipe record ${recordId}: ${outcome} (invalid: ${invalidFields.join(', ')})`);
}
