// Handles a submitted recipe form for the edit and new pages: saves it through the saveRecipe
// Action and says what the page should do next. The leading `_` keeps Astro from making it a route.
import type { AstroGlobal } from 'astro';
import { actions } from 'astro:actions';
import { SAVED_PARAM } from '../../components/SavedToast.tsx';
import { readFormData } from '../../lib/recipes/form.ts';
import type { RecipeId } from '../../lib/recipes/recipe.ts';

/** The page after a submit: off to the saved recipe, not found, or the form again with the typed values. */
export async function saveSubmittedForm(Astro: AstroGlobal, id?: RecipeId) {
  // A POST without form data (e.g. from a bot) is just an empty form
  const formData = await Astro.request.formData().catch(() => new FormData());
  const values = readFormData(formData);
  const { data, error } = await Astro.callAction(actions.saveRecipe, { ...values, id });

  if (data?.saved) {
    // 303: the browser follows with a GET, so reloading doesn't save again
    return { redirect: Astro.redirect(`/recipes/${data.id}?${SAVED_PARAM}`, 303) };
  }
  if (data) return { values, invalidFields: data.invalidFields };
  if (error.code === 'NOT_FOUND') return { notFound: true as const };
  // Airtable failed: keep what was typed so it can be sent again
  console.error('Saving a recipe failed', error);
  return { values, saveFailed: true };
}
