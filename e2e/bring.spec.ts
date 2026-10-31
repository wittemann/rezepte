// „Auf die Einkaufsliste“ on the recipe page (docs/decisions/0014-bring-shopping-list.md). Reads the
// live base and sends nothing to Bring: the action is blocked, and the test never presses the send
// button. Asserts no recipe data: only counts and checkbox states.
import { test, expect } from '@playwright/test';
import { TEXT } from '../src/components/BringButton.texts.ts';
import { login } from './login.ts';

test('the sheet lists the ingredients checked and unchecking counts down', async ({ page }) => {
  // Safety net: nothing may reach the family's shopping list
  await page.route('**/_actions/addToBring**', (route) => route.abort());
  await login(page);
  await page.goto('/recipes');
  const hrefs = await page
    .locator('a[data-recipe-id]')
    .evaluateAll((anchors) => anchors.slice(0, 15).map((a) => a.getAttribute('href') ?? ''));

  // The first recipe with at least two ingredient lines
  const openButton = page.getByRole('button', { name: TEXT.open });
  const sheet = page.getByRole('dialog', { name: TEXT.title });
  const checkboxes = sheet.getByRole('checkbox');
  let found = false;
  for (const href of hrefs) {
    await page.goto(href);
    if ((await openButton.count()) === 0) continue;
    // The sheet only opens once the island is hydrated
    await page.waitForLoadState('networkidle');
    await openButton.click();
    await expect(sheet).toBeVisible();
    if ((await checkboxes.count()) >= 2) {
      found = true;
      break;
    }
  }
  expect(found, 'a recipe with at least two ingredients among the first 15').toBe(true);

  const total = await checkboxes.count();
  for (const checkbox of await checkboxes.all()) await expect(checkbox).toBeChecked();
  await expect(sheet.getByText(TEXT.count(total, total))).toBeVisible();
  const submit = sheet.getByRole('button', { name: TEXT.submit(total) });
  await expect(submit).toBeEnabled();

  await checkboxes.first().uncheck();
  await expect(sheet.getByText(TEXT.count(total - 1, total))).toBeVisible();
  await expect(sheet.getByRole('button', { name: TEXT.submit(total - 1) })).toBeVisible();

  await sheet.getByRole('button', { name: TEXT.none }).click();
  await expect(sheet.getByRole('button', { name: TEXT.nothing })).toBeDisabled();
});
