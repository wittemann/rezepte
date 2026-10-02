// Start page: choosing a meal and the time. Reads the live base but writes nothing, and asserts
// no recipe data (the repo is public).
import { test, expect } from '@playwright/test';
import { TEXT } from '../src/pages/_index.texts.ts';
import { login } from './login.ts';

test('choosing meal and time changes the question and the choice', async ({ page }) => {
  await login(page);
  await page.goto('/');

  await page.getByRole('link', { name: TEXT.mealLabels.baking }).click();
  await expect(page).toHaveURL(/meal=baking/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(TEXT.headline.baking);
  await expect(page.getByRole('link', { name: TEXT.mealLabels.baking })).toHaveAttribute(
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
