// Server actions (docs/decisions/0006-forms-and-interactivity.md). The middleware already
// requires a session for every request, including calls to /_actions.
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { AIRTABLE_BASE_ID, AIRTABLE_TOKEN } from 'astro:env/server';
import { setFavorite } from '../lib/recipes/repository.ts';

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
};
