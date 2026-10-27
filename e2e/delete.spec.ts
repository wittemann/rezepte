// „Rezept löschen“ on the edit page. Never deletes: the test only opens the confirmation sheet and
// cancels it (the e2e token can only read anyway). Uses the first recipe and asserts no recipe data.
import { test, expect } from '@playwright/test';
import { TEXT } from '../src/components/DeleteRecipe.texts.ts';
import { login } from './login.ts';

test('„Rezept löschen“ asks first and „Abbrechen“ keeps the recipe', async ({ page }) => {
  await login(page);
  await page.goto('/recipes');
  await page.locator('a[data-recipe-id]').first().click();
  await expect(page).toHaveURL(/\/recipes\/rec\w+$/);
  const editPath = `${new URL(page.url()).pathname}/edit`;
  await page.goto(editPath);
  // The sheet only opens once the island is hydrated
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: TEXT.open }).click();
  const sheet = page.getByRole('dialog', { name: TEXT.title });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('button', { name: TEXT.confirm })).toBeVisible();

  await sheet.getByRole('button', { name: TEXT.cancel }).click();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(editPath);
});
