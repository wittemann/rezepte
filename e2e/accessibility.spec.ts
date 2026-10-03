// Accessibility checks on every screen: axe-core (WCAG 2.2 AA and best practices) in light and
// dark mode, and no sideways scrolling with large system text. Reads whatever the recipes are, so
// the test contains no recipe data (the repo is public).
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { login } from './login.ts';

/** About iOS's second accessibility text size (17px at the default setting). */
const LARGE_TEXT = '32px';

/** The paths of all screens, using the first recipe that has steps (so cooking mode shows). */
async function screens(page: Page) {
  await page.goto('/rezepte');
  const ids = await page
    .locator('a[data-recipe-id]')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-recipe-id') ?? ''));
  let recipeId = ids[0];
  for (const id of ids) {
    await page.goto(`/rezepte/${id}/cook`);
    // Cooking mode sends recipes without steps back to the recipe page
    if (page.url().endsWith('/cook')) {
      recipeId = id;
      break;
    }
  }
  return [
    '/',
    '/rezepte',
    '/favoriten',
    `/rezepte/${recipeId}`,
    `/rezepte/${recipeId}/cook`,
    `/rezepte/${recipeId}/edit`,
    '/neu',
  ];
}

async function expectNoViolations(page: Page, screen: string) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  const summary = violations.map((violation) => `${violation.id}: ${violation.help}`);
  expect(summary, screen).toEqual([]);
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`every screen passes axe in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/login');
    await expectNoViolations(page, '/login');

    await login(page);
    for (const screen of await screens(page)) {
      await page.goto(screen);
      await expectNoViolations(page, screen);
    }
  });
}

test('no screen scrolls sideways with large text', async ({ page }) => {
  await login(page);
  for (const screen of await screens(page)) {
    await page.goto(screen);
    await page.addStyleTag({ content: `html { font-size: ${LARGE_TEXT} !important; }` });
    // A page wider than the screen widens the layout viewport on a phone
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width, screen).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
  }
});
