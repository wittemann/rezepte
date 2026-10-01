import type { Page } from '@playwright/test';
import { TEXT } from '../src/components/LoginForm.texts.ts';
import { TEST_PASSWORD } from './test-credentials.ts';

/** Logs in with the test password and waits until the login page is left. */
export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel(TEXT.password).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: TEXT.submit }).click();
  await page.waitForURL((url) => url.pathname !== '/login');
}
