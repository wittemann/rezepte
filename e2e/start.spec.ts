// Start page: choosing a meal and the time. Reads the live base but writes nothing, and asserts
// no recipe data (the repo is public).
import { test, expect } from '@playwright/test';
import { TEXT as CAROUSEL_TEXT } from '../src/components/SuggestionCarousel.texts.ts';
import { TEXT as LIST_TEXT } from '../src/pages/recipes/_index.texts.ts';
import { TEXT } from '../src/pages/_index.texts.ts';
import { login } from './login.ts';

test('choosing meal and time changes the question and the choice', async ({ page }) => {
  await login(page);
  await page.goto('/');
  // Scoped: cards can have a category pill with the same word
  const mealTiles = page.getByRole('navigation', { name: TEXT.meals });

  await mealTiles.getByRole('link', { name: TEXT.mealLabels.baking }).click();
  await expect(page).toHaveURL(/meal=baking/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(TEXT.headline.baking);
  await expect(mealTiles.getByRole('link', { name: TEXT.mealLabels.baking })).toHaveAttribute(
    'aria-current',
    'true',
  );

  await page.getByRole('link', { name: TEXT.muchTime }).click();
  await expect(page).toHaveURL(/time=much/);
  await expect(page).toHaveURL(/meal=baking/); // the meal stays
  await expect(page.getByRole('link', { name: TEXT.muchTime })).toHaveAttribute(
    'aria-current',
    'true',
  );
});

test('a suggestion opens its recipe and the dice card shuffles anew', async ({ page }) => {
  await login(page);
  // Much time and Abend: the biggest pool, so there are cards on any base with recipes
  await page.goto('/?meal=lunch-dinner&time=much');

  await page.getByRole('link', { name: CAROUSEL_TEXT.reroll }).click();
  await expect(page).toHaveURL(/dice=1/);
  await expect(page).toHaveURL(/meal=lunch-dinner/);

  const card = page.locator('[data-suggestion-id]').first();
  await expect(card).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(/\/recipes\/rec\w+$/);
});

test('a category on the start page opens the filtered recipe list', async ({ page }) => {
  await login(page);
  await page.goto('/');

  await page.locator('a[href^="/recipes?category="]').first().click();
  await expect(page).toHaveURL(/\/recipes\?category=/);
  await expect(page.getByRole('heading', { level: 1, name: LIST_TEXT.title })).toBeVisible();
});
