// Edit and new recipe form. Never saves: the e2e token can only read, and the submit below is
// refused by the form's own checks before anything is sent to Airtable. Uses the first recipe,
// so the test contains no recipe data (the repo is public).
import { test, expect } from '@playwright/test';
import { TEXT } from '../src/components/RecipeForm.texts.ts';
import { TEXT as HEADER_TEXT } from '../src/components/RecipeHeader.texts.ts';
import { TEXT as TAB_TEXT } from '../src/components/TabBar.texts.ts';
import { login } from './login.ts';

test('"Bearbeiten" opens the filled form and "Abbrechen" goes back', async ({ page }) => {
  await login(page);
  await page.goto('/rezepte');
  await page.locator('a[data-recipe-id]').first().click();
  const recipeUrl = page.url();
  const title = await page.getByRole('heading', { level: 1 }).innerText();

  await page.getByRole('link', { name: HEADER_TEXT.edit }).click();
  await expect(page.getByRole('heading', { level: 1, name: TEXT.editTitle })).toBeVisible();
  await expect(page.getByLabel(TEXT.title)).toHaveValue(title);

  await page.getByRole('link', { name: TEXT.cancel }).click();
  await expect(page).toHaveURL(recipeUrl);
});

test('a new recipe needs a name and marks a wrong time', async ({ page }) => {
  await login(page);
  await page.goto('/');
  await page.getByRole('link', { name: TAB_TEXT.create }).click();
  await expect(page.getByRole('heading', { level: 1, name: TEXT.newTitle })).toBeVisible();
  // "Sichern" only reacts once the island is hydrated
  await page.waitForLoadState('networkidle');

  const save = page.getByRole('button', { name: TEXT.save });
  await expect(save).toBeDisabled();
  await page.getByLabel(TEXT.title).fill('E2E-Test');
  await expect(save).toBeEnabled();

  await page.getByLabel(TEXT.workTime).fill('20');
  await save.click();
  // The first submit on a fresh dev server compiles the Action first, which can take a while
  await expect(page.getByRole('alert')).toHaveText(TEXT.invalid, { timeout: 20_000 });
  await expect(page.getByText(TEXT.errors.workTime)).toBeVisible();
  await expect(page.getByLabel(TEXT.title)).toHaveValue('E2E-Test');
});
