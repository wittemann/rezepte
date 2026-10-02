// Recipe list: search, meal and filter sheet. Reads the live base, writes nothing, and asserts no
// recipe data (the repo is public): it searches for whatever the first recipe is called.
import { test, expect } from '@playwright/test';
import { TEXT as FILTER_TEXT } from '../src/components/FilterSheet.texts.ts';
import { TEXT as SEARCH_TEXT } from '../src/components/SearchField.texts.ts';
import { TEXT } from '../src/pages/rezepte/_index.texts.ts';
import { login } from './login.ts';

test('searching finds a recipe by its name and the cross clears the search', async ({ page }) => {
  await login(page);
  await page.goto('/rezepte');
  const title = await page.locator('a[data-recipe-id] .title').first().innerText();

  const search = page.getByRole('searchbox', { name: SEARCH_TEXT.placeholder });
  await search.fill(title);
  await search.press('Enter');

  await expect(page).toHaveURL(/[?&]q=/);
  await expect(page.getByText(/gefunden$/)).toBeVisible();
  // Exact match: another recipe's name may contain this one's
  await expect(
    page.locator('a[data-recipe-id] .title').getByText(title, { exact: true }).first(),
  ).toBeVisible();

  await page.getByRole('link', { name: SEARCH_TEXT.clear }).click();
  await expect(page).not.toHaveURL(/[?&]q=/);
  await expect(search).toHaveValue('');
});

test('the meal control filters the list', async ({ page }) => {
  await login(page);
  await page.goto('/rezepte');
  const meals = page.getByRole('group', { name: TEXT.meals });

  await meals.getByRole('link', { name: TEXT.mealLabels.baking }).click();
  await expect(page).toHaveURL(/meal=baking/);
  await expect(meals.getByRole('link', { name: TEXT.mealLabels.baking })).toHaveAttribute(
    'aria-current',
    'true',
  );
});

test('the filter sheet counts, applies and resets a filter', async ({ page }) => {
  await login(page);
  await page.goto('/rezepte');
  // The sheet only opens once the island is hydrated
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: FILTER_TEXT.filter, exact: true }).click();
  const sheet = page.getByRole('dialog', { name: FILTER_TEXT.filter });
  await expect(sheet).toBeVisible();

  await sheet.getByText(TEXT.withInstructions).click();
  const apply = sheet.getByRole('button', { name: /anzeigen$/ });
  const count = Number((await apply.innerText()).match(/^\d+/)?.[0]);
  await apply.click();

  await expect(page).toHaveURL(/steps=1/);
  await expect(page.getByRole('button', { name: FILTER_TEXT.filterLabel(1) })).toBeVisible();
  // The live count in the sheet matches what the server shows
  await expect(page.locator('main > header .count')).toHaveText(TEXT.count(count));

  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: FILTER_TEXT.filterLabel(1) }).click();
  await page.getByRole('link', { name: TEXT.reset }).click();
  await expect(page).not.toHaveURL(/steps=1/);
  await expect(page.getByRole('button', { name: FILTER_TEXT.filter, exact: true })).toBeVisible();
});
