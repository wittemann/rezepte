// Server actions (docs/decisions/0006-forms-and-interactivity.md). The middleware already
// requires a session for every request, including calls to /_actions.
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { AIRTABLE_BASE_ID, AIRTABLE_TOKEN } from 'astro:env/server';
import { JPEG_BASE64_PREFIX, MAX_PHOTO_BASE64_LENGTH } from '../lib/images/photo.ts';
import { addPhoto, setFavorite } from '../lib/recipes/repository.ts';

export const server = {
  /** Marks a recipe as favorite or not. Sets the state instead of toggling, so a repeated tap can't flip it back. */
  setFavorite: defineAction({
    input: z.object({ id: z.string(), favorite: z.boolean() }),
    handler: async ({ id, favorite }) => {
      const recipe = await setFavorite(
        { token: AIRTABLE_TOKEN, baseId: AIRTABLE_BASE_ID },
        id,
        favorite,
      );
      if (!recipe) throw new ActionError({ code: 'NOT_FOUND', message: 'Recipe not found' });
      return { favoritedAt: recipe.favoritedAt };
    },
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
    handler: async ({ id, file }) => {
      const found = await addPhoto({ token: AIRTABLE_TOKEN, baseId: AIRTABLE_BASE_ID }, id, file);
      if (!found) throw new ActionError({ code: 'NOT_FOUND', message: 'Recipe not found' });
    },
  }),
};
