// "Add to calendar" (docs/decisions/0013-weekly-menu-calendar.md): one all-day event for a recipe
// and a day. The login is checked by the middleware. Airtable errors are not caught (500 page).
import type { APIRoute } from 'astro';
import { AIRTABLE_BASE_ID, AIRTABLE_TOKEN } from 'astro:env/server';
import { buildCalendarEvent, isCalendarDate } from '../../../lib/recipes/calendar-event.ts';
import { getById } from '../../../lib/recipes/repository.ts';

export const GET: APIRoute = async ({ params, url }) => {
  const date = url.searchParams.get('date') ?? '';
  // Before any Airtable request
  if (!isCalendarDate(date)) return errorResponse(400);

  const recipe = await getById(
    { token: AIRTABLE_TOKEN, baseId: AIRTABLE_BASE_ID },
    params.id ?? '',
  );
  if (!recipe) return errorResponse(404);

  const body = buildCalendarEvent({
    title: recipe.title,
    recipeUrl: new URL(`/recipes/${recipe.id}`, url.origin).href,
    date,
    now: new Date(),
  });
  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      // ASCII-only on purpose: the title is in the event, not in the file name
      'Content-Disposition': 'inline; filename="rezept.ics"',
      'Cache-Control': 'private, no-store',
    },
  });
};

// No body, like the image route: the link is only followed from the app's own buttons
function errorResponse(status: number) {
  return new Response(null, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
