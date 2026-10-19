// "In den Kalender" on the recipe page (docs/decisions/0013-weekly-menu-calendar.md). Reads the
// live base and writes nothing. Asserts no recipe data: only dates, links and the file format.
import { test, expect } from '@playwright/test';
import { TEXT } from '../src/components/CalendarButton.texts.ts';
import { login } from './login.ts';

// The next seven days after today, in the same local time zone as the browser
function nextSevenDates() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index + 1);
    const month = String(day.getMonth() + 1).padStart(2, '0');
    return `${day.getFullYear()}-${month}-${String(day.getDate()).padStart(2, '0')}`;
  });
}

test('the calendar sheet offers the coming week as calendar files', async ({ page }) => {
  await login(page);
  await page.goto('/recipes');
  await page.locator('a[data-recipe-id]').first().click();
  await expect(page).toHaveURL(/\/recipes\/rec\w+$/);
  const recipePath = new URL(page.url()).pathname;
  // The sheet only opens once the island is hydrated
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: TEXT.open }).click();
  const sheet = page.getByRole('dialog', { name: TEXT.title });
  await expect(sheet).toBeVisible();

  const links = sheet.getByRole('link');
  await expect(links).toHaveCount(7);
  const hrefs = await links.evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')));
  const dates = hrefs.map((href) => new URL(href ?? '', page.url()).searchParams.get('date'));
  expect([...dates].sort()).toEqual(nextSevenDates());

  // The request shares the browser's login cookie
  const response = await page.request.get(hrefs[0] ?? '');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/calendar');
  const body = await response.text();
  expect(body).toContain('BEGIN:VEVENT');
  expect(body).toContain(`DTSTART;VALUE=DATE:${dates[0]?.replaceAll('-', '')}`);
  expect(body.replaceAll('\r\n ', '')).toContain(`URL:${new URL(recipePath, page.url()).href}`);
});
