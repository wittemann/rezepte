// Cooking mode: from the recipe page through the steps. Reads the live base, writes nothing, and
// asserts no recipe data (the repo is public): it uses the first recipe that has instructions.
import { test, expect, type Page } from '@playwright/test';
import { TEXT } from '../src/components/CookingMode.texts.ts';
import { TEXT as COOK_BUTTON_TEXT } from '../src/components/CookButton.texts.ts';
import { TEXT as INGREDIENTS_TEXT } from '../src/components/Ingredients.texts.ts';
import { TEXT as RATING_STEP_TEXT } from '../src/components/RatingStep.texts.ts';
import { login } from './login.ts';

/**
 * The first recipe with instructions, so its page links to cooking mode, and with every text in
 * `alsoContaining` on its page.
 */
async function findCookableRecipe(page: Page, alsoContaining: string[] = []) {
  await page.goto('/recipes');
  const ids = await page
    .locator('a[data-recipe-id]')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-recipe-id') ?? ''));
  for (const id of ids) {
    const response = await page.request.get(`/recipes/${id}`);
    const html = await response.text();
    const matches = [`/recipes/${id}/cook`, ...alsoContaining].every((text) => html.includes(text));
    if (matches) return id;
  }
  throw new Error('No recipe with instructions');
}

test('cooking mode steps forward and back and ends at the recipe', async ({ page }) => {
  await login(page);
  const cookable = await findCookableRecipe(page);

  await page.goto(`/recipes/${cookable}`);
  // The launcher island only takes over the link once it is hydrated
  await page.waitForLoadState('networkidle');
  // Cooking mode opens on the recipe page (for the wake lock): the marker survives, no page load
  await page.evaluate(() => Object.assign(window, { samePage: true }));
  await page.getByRole('link', { name: COOK_BUTTON_TEXT.label }).click();
  await expect(page).toHaveURL(/\/cook$/);

  const previous = page.getByRole('button', { name: TEXT.previous });
  await expect(page.getByText(/^Schritt 1 von \d+/)).toBeVisible();
  await expect(previous).toBeDisabled();

  const next = page.getByRole('button', { name: TEXT.next });
  if (await next.isVisible()) {
    await next.click();
    await expect(page.getByText(/^Schritt 2 von \d+/)).toBeVisible();
    await previous.click();
    await expect(page.getByText(/^Schritt 1 von \d+/)).toBeVisible();
  }

  while (await page.getByRole('button', { name: TEXT.next }).isVisible()) {
    await page.getByRole('button', { name: TEXT.next }).click();
  }
  // The last step asks for the rating (and a photo, if the recipe has none) and can be skipped
  await expect(page.getByText(RATING_STEP_TEXT.label)).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: /^Bewertung: / })).toBeVisible();
  const end = page
    .getByRole('link', { name: TEXT.done })
    .or(page.getByRole('link', { name: TEXT.skip }));
  await end.click();
  await expect(page).toHaveURL(new RegExp(`/recipes/${cookable}$`));
  await expect(page.getByRole('link', { name: COOK_BUTTON_TEXT.label })).toBeVisible();
  expect(await page.evaluate(() => 'samePage' in window)).toBe(true);
});

test('the back button closes cooking mode', async ({ page }) => {
  await login(page);
  const cookable = await findCookableRecipe(page);

  await page.goto(`/recipes/${cookable}`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('link', { name: COOK_BUTTON_TEXT.label }).click();
  await expect(page.getByRole('button', { name: TEXT.previous })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/recipes/${cookable}$`));
  await expect(page.getByRole('button', { name: TEXT.previous })).toBeHidden();
  await expect(page.getByRole('link', { name: COOK_BUTTON_TEXT.label })).toBeVisible();
});

test('cooking mode shows the ingredients for the servings chosen on the recipe page', async ({
  page,
}) => {
  await login(page);
  // A recipe with servings has the stepper
  const cookable = await findCookableRecipe(page, [INGREDIENTS_TEXT.moreServings]);

  await page.goto(`/recipes/${cookable}`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: INGREDIENTS_TEXT.moreServings }).click();
  const chosen = await page.locator('[aria-live="polite"] span').first().textContent();
  await page.getByRole('link', { name: COOK_BUTTON_TEXT.label }).click();
  await expect(page).toHaveURL(/\/cook\?servings=/);

  await page.getByRole('button', { name: TEXT.ingredients }).click();
  await expect(
    page.getByRole('heading', { name: `${TEXT.ingredients} · ${chosen} ` }),
  ).toBeVisible();
});
