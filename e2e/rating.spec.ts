// Rating stars in the recipe header. The e2e token can only read, so saving a star always fails:
// the test checks that the stars go back to what they were and the toast says so. This runs the
// whole path (island, action, Airtable) without writing anything. Uses whatever the first recipe
// is, so it contains no recipe data.
import { test, expect } from '@playwright/test';
import { TEXT as RATING_TEXT } from '../src/components/RecipeRating.texts.ts';
import { login } from './login.ts';

test('a star that cannot be saved goes back and shows a toast', async ({ page }) => {
  await login(page);
  await page.goto('/recipes');
  await page.locator('a[data-recipe-id]').first().click();
  await expect(page).toHaveURL(/\/recipes\/rec\w+$/);
  // The stars only react once the island is hydrated
  await page.waitForLoadState('networkidle');

  const stars = page.getByRole('radiogroup', { name: /^Bewertung: / });
  const labelBefore = await stars.getAttribute('aria-label');
  // A star that isn't selected, so the tap sets a rating instead of removing it
  const star = stars.getByRole('radio', { checked: false }).first();
  await star.click();

  await expect(page.getByRole('status').getByText(RATING_TEXT.error)).toBeVisible();
  await expect(stars).toHaveAttribute('aria-label', labelBefore!);
  await expect(star).toHaveAttribute('aria-checked', 'false');
});
