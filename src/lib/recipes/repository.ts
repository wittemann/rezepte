// Reads recipes from Airtable as domain Recipes (docs/decisions/0002-airtable-as-source-of-truth.md).
// The connection is passed in, like in lib/airtable/client.ts, so tests and scripts can use it.
// Writing (create, update) follows in a later step.

import {
  isRecordId,
  listRecords,
  type AirtableConnection,
  type AirtableRecord,
} from '../airtable/client.ts';
import { RECIPES_TABLE_ID } from './fields.ts';
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
  // Anything that isn't a record ID can't be a recipe; checking it also keeps the formula safe.
  if (!isRecordId(id)) return undefined;
  // A filtered list instead of GET …/{id}: for an unknown ID, that answers 403 (not 404), which
  // looks like a permission problem. The list is simply empty, and a 403 stays a real error.
  const [record] = await listRecords(connection, RECIPES_TABLE_ID, {
    filterByFormula: `RECORD_ID() = '${id}'`,
  });
  return record ? readAndReport(record) : undefined;
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
