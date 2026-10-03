// Smoke test: login → recipes list → first recipe. Reads whatever the first recipe is, so the
// test contains no recipe data (the repo is public).
import { test, expect } from '@playwright/test';
import { TEXT as LOGIN_TEXT } from '../src/components/LoginForm.texts.ts';
import { TEXT as LIST_TEXT } from '../src/pages/rezepte/_index.texts.ts';
import { login } from './login.ts';

test('a wrong password shows the error and stays on the login page', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(LOGIN_TEXT.password).fill('definitely-not-the-password');
  await page.getByRole('button', { name: LOGIN_TEXT.submit }).click();

  await expect(page.getByText(LOGIN_TEXT.wrongPassword)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test('pages need a login', async ({ page }) => {
  await page.goto('/rezepte');
  await expect(page).toHaveURL(/\/login\?next=%2Frezepte/);
});

// Astro also runs actions for `?_action=<name>` on any page, the login page included. Empty input,
// so nothing could be written even if the action ran: it would answer 400 instead of 302.
test('actions need a login, also when called through the login page', async ({ request }) => {
  for (const path of ['/_actions/setFavorite', '/login?_action=setFavorite']) {
    const response = await request.post(path, { data: {}, maxRedirects: 0 });
    expect(response.status(), path).toBe(302);
  }
});

test('login → recipes list → first recipe', async ({ page }) => {
  await login(page);

  await page.goto('/rezepte');
  await expect(page.getByRole('heading', { level: 1, name: LIST_TEXT.title })).toBeVisible();

  const firstRow = page.locator('a[data-recipe-id]').first();
  await expect(firstRow).toBeVisible();
  const title = await firstRow.locator('.title').innerText();
  await firstRow.click();

  await expect(page).toHaveURL(/\/rezepte\/rec\w+$/);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
});
