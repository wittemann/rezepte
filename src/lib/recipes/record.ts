// Airtable record → domain Recipe, checked with zod (docs/specs/03-data-model.md, "Validation";
// docs/decisions/0002-airtable-as-source-of-truth.md, "Tolerant reading").
// Only the title is required. A field with an unexpected shape is left out and reported, the
// rest of the recipe is kept, so one odd value doesn't hide a whole recipe.

import { z } from 'zod';
import type { AirtableRecord } from '../airtable/client.ts';
import { MEALS, RECIPE_FIELDS, type Meal } from './fields.ts';
import { parseIngredients } from './ingredients.ts';
import { parseMethod } from './method.ts';
import type { Recipe, RecipeImage } from './recipe.ts';
import { secondsToMinutes } from './time.ts';

/** What reading a record gave: the recipe, and the fields that were left out. */
export type RecordReading = {
  recipe?: Recipe; // missing when the record has no title
  invalidFields: string[]; // domain names from RECIPE_FIELDS, e.g. "servings"
};

const MEAL_VALUES: readonly string[] = MEALS.map((meal) => meal.value);

// An Airtable attachment, with the parts the app uses. Other keys (the expiring URL,
// thumbnails, …) are dropped by zod.
const attachmentSchema = z.object({
  id: z.string(),
  type: z.string().optional(), // MIME type, e.g. "image/jpeg"
  width: z.number().optional(),
  height: z.number().optional(),
});

// Airtable leaves empty fields out, so every field but the title is optional.
const recordFieldsSchema = z.object({
  [RECIPE_FIELDS.title]: z.string().trim().min(1),
  [RECIPE_FIELDS.category]: z.string().optional(),
  [RECIPE_FIELDS.meals]: z.array(z.string()).optional(),
  [RECIPE_FIELDS.servings]: z.number().positive().optional(),
  [RECIPE_FIELDS.workTime]: z.number().nonnegative().optional(),
  [RECIPE_FIELDS.totalTime]: z.number().nonnegative().optional(),
  [RECIPE_FIELDS.ingredients]: z.string().optional(),
  [RECIPE_FIELDS.steps]: z.string().optional(),
  [RECIPE_FIELDS.caloriesPerServing]: z.number().optional(), // a formula, read-only
  [RECIPE_FIELDS.images]: z.array(attachmentSchema).optional(),
  [RECIPE_FIELDS.source]: z.string().optional(),
  // Shown as a link, so only http(s): a "javascript:" URL must never reach an href.
  [RECIPE_FIELDS.sourceUrl]: z.url({ protocol: /^https?$/ }).optional(),
  [RECIPE_FIELDS.notes]: z.string().optional(),
  [RECIPE_FIELDS.favoritedAt]: z.iso.datetime().optional(),
});

type RecordFields = z.infer<typeof recordFieldsSchema>;

/** The app-internal image URL (ADR 0005); the image proxy route serves it. */
export function imageUrl(recordId: string, attachmentId: string): string {
  return `/img/${encodeURIComponent(recordId)}/${encodeURIComponent(attachmentId)}`;
}

/** Checks the record's fields and turns it into a Recipe. Never throws. */
export function readRecord(record: AirtableRecord): RecordReading {
  const result = recordFieldsSchema.safeParse(record.fields);
  if (result.success) return { recipe: toRecipe(record, result.data), invalidFields: [] };

  const invalidFieldIds = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
  const invalidFields = invalidFieldIds.map(fieldName);
  if (invalidFieldIds.includes(RECIPE_FIELDS.title)) return { invalidFields };

  // Leave out the fields with a wrong shape; the rest passed, so this parse succeeds.
  const validFields = Object.fromEntries(
    Object.entries(record.fields).filter(([fieldId]) => !invalidFieldIds.includes(fieldId)),
  );
  return { recipe: toRecipe(record, recordFieldsSchema.parse(validFields)), invalidFields };
}

function toRecipe(record: AirtableRecord, fields: RecordFields): Recipe {
  const ingredientsText = fields[RECIPE_FIELDS.ingredients] ?? '';
  const stepsText = fields[RECIPE_FIELDS.steps] ?? '';
  return {
    id: record.id,
    title: fields[RECIPE_FIELDS.title],
    category: fields[RECIPE_FIELDS.category],
    meals: knownMeals(fields[RECIPE_FIELDS.meals] ?? []),
    servings: fields[RECIPE_FIELDS.servings],
    workMinutes: optionalMinutes(fields[RECIPE_FIELDS.workTime]),
    totalMinutes: optionalMinutes(fields[RECIPE_FIELDS.totalTime]),
    caloriesPerServing: fields[RECIPE_FIELDS.caloriesPerServing],
    ingredientsText,
    stepsText,
    ingredients: parseIngredients(ingredientsText),
    method: parseMethod(stepsText),
    hasInstructions: stepsText.trim() !== '', // empty Zubereitung = an idea ("stub")
    images: toImages(record.id, fields[RECIPE_FIELDS.images] ?? []),
    source: fields[RECIPE_FIELDS.source],
    sourceUrl: fields[RECIPE_FIELDS.sourceUrl],
    notes: fields[RECIPE_FIELDS.notes],
    favoritedAt: fields[RECIPE_FIELDS.favoritedAt],
    createdAt: record.createdTime,
  };
}

/** Meals the app knows; other values have no color or suggestion slot, so they're left out. */
function knownMeals(values: string[]): Meal[] {
  return values.filter((value): value is Meal => MEAL_VALUES.includes(value));
}

function optionalMinutes(seconds: number | undefined): number | undefined {
  return seconds === undefined ? undefined : secondsToMinutes(seconds);
}

/** Image attachments only; other files (a PDF, say) aren't shown. */
function toImages(
  recordId: string,
  attachments: z.infer<typeof attachmentSchema>[],
): RecipeImage[] {
  return attachments
    .filter((attachment) => attachment.type?.startsWith('image/'))
    .map((attachment) => ({
      id: attachment.id,
      url: imageUrl(recordId, attachment.id),
      width: attachment.width,
      height: attachment.height,
    }));
}

/** Field ID → domain name ("fldCRBNH34d7JR7OC" → "title"), for readable reports. */
function fieldName(fieldId: string): string {
  const entry = Object.entries(RECIPE_FIELDS).find(([, id]) => id === fieldId);
  return entry ? entry[0] : fieldId;
}
