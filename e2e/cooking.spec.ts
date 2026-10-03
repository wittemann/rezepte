// Cooking mode: from the recipe page through the steps. Reads the live base, writes nothing, and
// asserts no recipe data (the repo is public): it uses the first recipe that has instructions.
import { test, expect, type Page } from '@playwright/test';
import { TEXT } from '../src/components/CookingMode.texts.ts';
import { TEXT as COOK_BUTTON_TEXT } from '../src/components/CookButton.texts.ts';
import { login } from './login.ts';

/** The first recipe with instructions, so its page links to cooking mode. */
async function findCookableRecipe(page: Page) {
  await page.goto('/rezepte');
  const ids = await page
    .locator('a[data-recipe-id]')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-recipe-id') ?? ''));
  for (const id of ids) {
    const response = await page.request.get(`/rezepte/${id}`);
    const html = await response.text();
    if (html.includes(`/rezepte/${id}/cook`)) return id;
  }
  throw new Error('No recipe with instructions');
}

test('cooking mode steps forward and back and ends at the recipe', async ({ page }) => {
  await login(page);
  const cookable = await findCookableRecipe(page);

  await page.goto(`/rezepte/${cookable}`);
  await page.getByRole('link', { name: COOK_BUTTON_TEXT.label }).click();
  await expect(page).toHaveURL(/\/cook$/);
  // The buttons only work once the island is hydrated
  await page.waitForLoadState('networkidle');

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
  // Recipes without a photo end with the photo step, which can be skipped
  const end = page
    .getByRole('link', { name: TEXT.done })
    .or(page.getByRole('link', { name: TEXT.skip }));
  await end.click();
  await expect(page).toHaveURL(new RegExp(`/rezepte/${cookable}$`));
});
