// Server actions (docs/decisions/0006-forms-and-interactivity.md). The middleware already
// requires a session for every request, including calls to /_actions.
// Each action logs what it did to Sentry Logs, with record IDs only (no recipe names or texts).
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import {
  AIRTABLE_BASE_ID,
  AIRTABLE_TOKEN,
  BRING_EMAIL,
  BRING_LIST_UUID,
  BRING_PASSWORD,
} from 'astro:env/server';
import { addItems } from '../lib/bring/client.ts';
import { pickLines, toBringItems } from '../lib/bring/items.ts';
import { JPEG_BASE64_PREFIX, MAX_PHOTO_BASE64_LENGTH } from '../lib/images/photo.ts';
import { logInfo, logWarning } from '../lib/monitoring.ts';
import { RATINGS } from '../lib/recipes/fields.ts';
import { readFormValues, recipeFormSchema } from '../lib/recipes/form.ts';
import {
  addPhoto,
  create,
  getById,
  remove,
  setFavorite,
  setRating,
  update,
} from '../lib/recipes/repository.ts';
import { servingsFactor } from '../lib/recipes/servings.ts';
import { withGenericErrors } from './with-generic-errors.ts';

/** The answer for a recipe ID that doesn't exist (any more), logged as a warning. */
function notFound(action: string, id: string) {
  logWarning('Recipe not found', { action, 'recipe.record_id': id });
  return new ActionError({ code: 'NOT_FOUND', message: 'Recipe not found' });
}

export const server = {
  /** Marks a recipe as favorite or not. Sets the state instead of toggling, so a repeated tap can't flip it back. */
  setFavorite: defineAction({
    input: z.object({ id: z.string(), favorite: z.boolean() }),
    handler: withGenericErrors('setFavorite', async ({ id, favorite }) => {
      const recipe = await setFavorite(
        { token: AIRTABLE_TOKEN, baseId: AIRTABLE_BASE_ID },
        id,
        favorite,
      );
      if (!recipe) throw notFound('setFavorite', id);
      logInfo(favorite ? 'Recipe favorited' : 'Recipe unfavorited', { 'recipe.record_id': id });
      return { favoritedAt: recipe.favoritedAt };
    }),
  }),

  /** Sets the shared rating of a recipe (1–5 stars), or removes it with `null`. */
  setRating: defineAction({
    input: z.object({ id: z.string(), rating: z.literal(RATINGS).nullable() }),
    handler: withGenericErrors('setRating', async ({ id, rating }) => {
      const recipe = await setRating(
        { token: AIRTABLE_TOKEN, baseId: AIRTABLE_BASE_ID },
        id,
        rating ?? undefined,
      );
      if (!recipe) throw notFound('setRating', id);
      logInfo(rating ? 'Recipe rated' : 'Recipe rating removed', {
        'recipe.record_id': id,
        'recipe.rating': rating ?? 0,
      });
      return { rating: recipe.rating ?? null };
    }),
  }),

  /**
   * Adds the photo from the last step of cooking mode to a recipe. The browser sends it already
   * shrunk to a JPEG, as base64 text; anything else is refused.
   */
  addPhoto: defineAction({
    input: z.object({
      id: z.string(),
      file: z
        .string()
        .max(MAX_PHOTO_BASE64_LENGTH)
        .startsWith(JPEG_BASE64_PREFIX)
        .regex(/^[A-Za-z0-9+/]+={0,2}$/),
    }),
    handler: withGenericErrors('addPhoto', async ({ id, file }) => {
      const found = await addPhoto({ token: AIRTABLE_TOKEN, baseId: AIRTABLE_BASE_ID }, id, file);
      if (!found) throw notFound('addPhoto', id);
      logInfo('Photo added', { 'recipe.record_id': id });
    }),
  }),

  /**
   * Saves the edit form: a new recipe without `id`, else changes that one (only the app's fields).
   * Invalid fields aren't an error: they come back as `invalidFields`, so the form can mark them.
   */
  saveRecipe: defineAction({
    input: recipeFormSchema.extend({ id: z.string().optional() }),
    handler: withGenericErrors('saveRecipe', async ({ id, ...values }) => {
      const form = readFormValues(values);
      if (!form.valid) {
        logInfo('Recipe form invalid', { 'recipe.invalid_fields': form.invalidFields.join(',') });
        return { saved: false as const, invalidFields: form.invalidFields };
      }

      const connection = { token: AIRTABLE_TOKEN, baseId: AIRTABLE_BASE_ID };
      const recipe = id
        ? await update(connection, id, form.input)
        : await create(connection, form.input);
      if (!recipe) throw notFound('saveRecipe', id ?? '');
      logInfo(id ? 'Recipe updated' : 'Recipe created', { 'recipe.record_id': recipe.id });
      return { saved: true as const, id: recipe.id };
    }),
  }),

  /**
   * Puts picked ingredients of a recipe on the family's Bring list (ADR 0014). `lines` are
   * positions in the recipe's ingredient list; `servings` are the ones chosen on the page, so the
   * amounts match what the user sees.
   */
  addToBring: defineAction({
    input: z.object({
      id: z.string(),
      servings: z.number().positive().max(1000).optional(),
      lines: z.array(z.number().int().min(0)).min(1).max(200),
    }),
    handler: withGenericErrors('addToBring', async ({ id, servings, lines }) => {
      const recipe = await getById({ token: AIRTABLE_TOKEN, baseId: AIRTABLE_BASE_ID }, id);
      if (!recipe) throw notFound('addToBring', id);

      const picked = pickLines(recipe.ingredients, lines);
      if (!picked) throw new ActionError({ code: 'BAD_REQUEST', message: 'Unknown lines' });

      if (!BRING_EMAIL || !BRING_PASSWORD || !BRING_LIST_UUID) {
        throw new Error('BRING_EMAIL, BRING_PASSWORD or BRING_LIST_UUID is not set');
      }
      const factor = recipe.servings && servings ? servingsFactor(servings, recipe.servings) : 1;
      const items = toBringItems(picked, factor);
      await addItems(
        { email: BRING_EMAIL, password: BRING_PASSWORD, listUuid: BRING_LIST_UUID },
        items,
      );
      logInfo('Ingredients added to Bring', {
        'recipe.record_id': id,
        'bring.item_count': items.length,
      });
      return { added: items.length };
    }),
  }),

  /** Deletes a recipe in Airtable. The edit page asks for confirmation first. */
  deleteRecipe: defineAction({
    input: z.object({ id: z.string() }),
    handler: withGenericErrors('deleteRecipe', async ({ id }) => {
      const deleted = await remove({ token: AIRTABLE_TOKEN, baseId: AIRTABLE_BASE_ID }, id);
      if (!deleted) throw notFound('deleteRecipe', id);
      logInfo('Recipe deleted', { 'recipe.record_id': id });
    }),
  }),
};
