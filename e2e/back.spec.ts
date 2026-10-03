// Back navigation from a recipe keeps the list's search. Reads the live base, writes nothing, and
// asserts no recipe data (the repo is public): it searches for whatever the first recipe is called.
import { test, expect } from '@playwright/test';
import { TEXT as HEADER_TEXT } from '../src/components/RecipeHeader.texts.ts';
import { TEXT as FORM_TEXT } from '../src/components/RecipeForm.texts.ts';
import { TEXT as SEARCH_TEXT } from '../src/components/SearchField.texts.ts';
import { login } from './login.ts';

test('the back arrow returns to the search, also after "Abbrechen" in the form', async ({
  page,
}) => {
  await login(page);
  await page.goto('/rezepte');
  const title = await page.locator('a[data-recipe-id] .title').first().innerText();
  const search = page.getByRole('searchbox', { name: SEARCH_TEXT.placeholder });
  await search.fill(title);
  await search.press('Enter');
  await expect(page).toHaveURL(/[?&]q=/);
  const listUrl = page.url();

  await page.locator('a[data-recipe-id]').first().click();
  await page.getByRole('link', { name: HEADER_TEXT.edit }).click();
  await page.getByRole('link', { name: FORM_TEXT.cancel }).click();
  await page.getByRole('link', { name: HEADER_TEXT.back }).click();

  await expect(page).toHaveURL(listUrl);
  await expect(search).toHaveValue(title);
});
