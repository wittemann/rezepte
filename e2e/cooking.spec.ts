// Cooking mode: from the recipe page through the steps. Reads the live base, writes nothing, and
// asserts no recipe data (the repo is public): it uses the first recipe that has instructions.
import { test, expect } from '@playwright/test';
import { TEXT } from '../src/components/CookingMode.texts.ts';
import { TEXT as COOK_BUTTON_TEXT } from '../src/components/CookButton.texts.ts';
import { login } from './login.ts';

test('cooking mode steps forward and back and ends at the recipe', async ({ page }) => {
  await login(page);
  await page.goto('/rezepte');
  const ids = await page
    .locator('a[data-recipe-id]')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-recipe-id')));

  let cookable: string | undefined;
  for (const id of ids) {
    const response = await page.request.get(`/rezepte/${id}`);
    if ((await response.text()).includes(`/rezepte/${id}/cook`)) {
      cookable = id;
      break;
    }
  }
  expect(cookable, 'a recipe with instructions').toBeDefined();

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
  await page.getByRole('link', { name: TEXT.done }).click();
  await expect(page).toHaveURL(new RegExp(`/rezepte/${cookable}$`));
});
