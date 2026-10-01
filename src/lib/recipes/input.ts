// What the edit form saves (domain RecipeInput) → Airtable fields for create and update
// (docs/specs/03-data-model.md, "Airtable mapping" and "Data conventions";
// docs/decisions/0002-airtable-as-source-of-truth.md, "Writes").
// Strict, unlike reading: the client writes with `typecast: true`, which would silently add any
// unknown category, meal or source as a new select option.

import { z } from 'zod';
import {
  CATEGORIES,
  MEALS,
  RECIPE_FIELDS,
  SOURCES,
  type Category,
  type Meal,
  type Source,
} from './fields.ts';
import { minutesToSeconds } from './time.ts';

/** A recipe as the form saves it. Missing optional fields are written as empty. */
export type RecipeInput = {
  title: string; // required, not blank
  category?: Category; // only the known categories (the form offers them as chips)
  meals: Meal[]; // empty = no start page suggestions
  servings?: number; // whole number > 0
  workMinutes?: number; // "Arbeitszeit", whole minutes ≥ 0
  totalMinutes?: number; // "Gesamtzeit", whole minutes ≥ 0
  ingredientsText: string;
  stepsText: string; // empty = an idea ("stub")
  source?: Source; // only the known sources
  sourceUrl?: string; // http(s) only
  notes?: string;
};

const CATEGORY_VALUES: Category[] = CATEGORIES.map((category) => category.value);
const MEAL_VALUES: Meal[] = MEALS.map((meal) => meal.value);

// Trimmed; blank text counts as empty.
const optionalText = z
  .string()
  .trim()
  .transform((text) => (text === '' ? undefined : text))
  .optional();

const wholeMinutes = z.number().int().nonnegative().optional();

/** Checks and cleans a RecipeInput: trims texts, blank → empty. Reusable by the form's Action. */
export const recipeInputSchema = z.object({
  title: z.string().trim().min(1),
  category: z.literal(CATEGORY_VALUES).optional(),
  meals: z.array(z.literal(MEAL_VALUES)),
  servings: z.number().int().positive().optional(),
  workMinutes: wholeMinutes,
  totalMinutes: wholeMinutes,
  ingredientsText: z.string().trim(),
  stepsText: z.string().trim(),
  source: z.literal(SOURCES).optional(),
  // Shown as a link, so only http(s), as on the read side (record.ts).
  sourceUrl: optionalText.pipe(z.url({ protocol: /^https?$/ }).optional()),
  notes: optionalText,
}) satisfies z.ZodType<RecipeInput>;

/**
 * The Airtable fields for a recipe, keyed by field ID. Checks `input` first (throws a ZodError
 * if it's invalid) and drops anything that isn't a RecipeInput field.
 *
 * Every writable field is always included, empty ones as `null` (`[]` for meals), so a PATCH
 * clears what was emptied in the form. Never included: Kalorien pro Portion (formula),
 * Kalorien gesamt and Meine Bewertung (not used by the app), Foto (upload only, ADR 0005).
 */
export function toRecordFields(input: RecipeInput): Record<string, unknown> {
  const recipe = recipeInputSchema.parse(input);
  return {
    [RECIPE_FIELDS.title]: recipe.title,
    [RECIPE_FIELDS.category]: recipe.category ?? null,
    [RECIPE_FIELDS.meals]: recipe.meals,
    [RECIPE_FIELDS.servings]: recipe.servings ?? null,
    [RECIPE_FIELDS.workTime]: optionalSeconds(recipe.workMinutes),
    [RECIPE_FIELDS.totalTime]: optionalSeconds(recipe.totalMinutes),
    [RECIPE_FIELDS.ingredients]: recipe.ingredientsText || null,
    [RECIPE_FIELDS.steps]: recipe.stepsText || null,
    [RECIPE_FIELDS.source]: recipe.source ?? null,
    [RECIPE_FIELDS.sourceUrl]: recipe.sourceUrl ?? null,
    [RECIPE_FIELDS.notes]: recipe.notes ?? null,
  };
}

function optionalSeconds(minutes: number | undefined): number | null {
  return minutes === undefined ? null : minutesToSeconds(minutes);
}
