// „Rezept teilen“ on the recipe page (docs/decisions/0015-share-recipe-as-text.md). Reads the live
// base and sends nothing: navigator.share is replaced by a stub that only records what it gets.
// Asserts no recipe data: the title is read from the page itself.
import { test, expect } from '@playwright/test';
import { TEXT } from '../src/components/ShareButton.texts.ts';
import { TEXT as BRING_TEXT } from '../src/components/BringButton.texts.ts';
import { login } from './login.ts';

type Shared = { title?: string; text?: string };

test('the share button hands the recipe as text to the share sheet', async ({ page }) => {
  // Before any page script runs: record the share data instead of opening a share sheet
  await page.addInitScript(() => {
    const target = window as unknown as { shared: Shared[] };
    target.shared = [];
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: Shared) => {
        target.shared.push(data);
      },
    });
  });
  await login(page);
  await page.goto('/recipes');
  const hrefs = await page
    .locator('a[data-recipe-id]')
    .evaluateAll((anchors) => anchors.slice(0, 15).map((a) => a.getAttribute('href') ?? ''));

  // The first recipe with ingredients: its share button sits next to the shopping list
  let found = false;
  for (const href of hrefs) {
    await page.goto(href);
    if ((await page.getByRole('button', { name: BRING_TEXT.open }).count()) > 0) {
      found = true;
      break;
    }
  }
  expect(found, 'a recipe with ingredients among the first 15').toBe(true);

  // The button only works once the island is hydrated
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: TEXT.label }).click();

  const title = (await page.locator('h1').textContent())?.trim() ?? '';
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { shared: Shared[] }).shared.length))
    .toBe(1);
  const [shared] = await page.evaluate(() => (window as unknown as { shared: Shared[] }).shared);
  expect(shared?.title).toBe(title);
  expect(shared?.text?.startsWith(`${title}\n`)).toBe(true);
  expect(shared?.text).toContain('\n\nZutaten\n- ');
  // The share sheet was used, so there's no copy toast
  await expect(page.getByText(TEXT.copied)).toHaveCount(0);
});
