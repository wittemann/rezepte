// Favorites page. Reads the live base and writes nothing (the heart isn't toggled: the e2e token
// can only read). Works with or without favorites in the base, and asserts no recipe data.
import { test, expect } from '@playwright/test';
import { TEXT as FAVORITE_TEXT } from '../src/components/FavoriteButton.texts.ts';
import { TEXT as TAB_TEXT } from '../src/components/TabBar.texts.ts';
import { TEXT } from '../src/pages/_favoriten.texts.ts';
import { login } from './login.ts';

test('the favorites tab lists recipes whose heart is filled', async ({ page }) => {
  await login(page);
  await page.goto('/');
  await page.getByRole('link', { name: TAB_TEXT.favorites }).click();
  await expect(page.getByRole('heading', { level: 1, name: TEXT.title })).toBeVisible();

  const rows = page.locator('a[data-recipe-id]');
  if ((await rows.count()) === 0) {
    await expect(page.getByText(TEXT.emptyTitle)).toBeVisible();
    return;
  }
  await rows.first().click();
  await expect(page).toHaveURL(/\/rezepte\/rec\w+$/);
  await expect(page.getByRole('button', { name: FAVORITE_TEXT.remove })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
