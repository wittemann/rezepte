import type { APIContext } from 'astro';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRecipe } from '../../../lib/recipes/test-recipe.ts';
import { GET } from './calendar.ics.ts';

vi.mock('astro:env/server', () => ({ AIRTABLE_TOKEN: 'token', AIRTABLE_BASE_ID: 'appTest' }));

const getById = vi.hoisted(() => vi.fn());
vi.mock('../../../lib/recipes/repository.ts', () => ({ getById }));

beforeEach(() => getById.mockReset());

function request(search: string, id = 'recX1') {
  return GET({
    params: { id },
    url: new URL(`https://example.test/recipes/${id}/calendar.ics${search}`),
  } as unknown as APIContext);
}

describe('calendar.ics route', () => {
  it.each(['', '?date=', '?date=2026-02-30', '?date=morgen'])(
    'answers 400 for the date query %j without asking Airtable',
    async (search) => {
      const response = await request(search);
      expect(response.status).toBe(400);
      expect(getById).not.toHaveBeenCalled();
    },
  );

  it('answers 404 for an unknown recipe', async () => {
    getById.mockResolvedValue(undefined);
    const response = await request('?date=2026-10-19', 'recUnknown');
    expect(getById).toHaveBeenCalledWith({ token: 'token', baseId: 'appTest' }, 'recUnknown');
    expect(response.status).toBe(404);
  });

  it('answers the event with the recipe title and its absolute URL', async () => {
    getById.mockResolvedValue(makeRecipe({ id: 'recX1', title: 'Beispiel Suppe' }));
    const response = await request('?date=2026-10-19');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/calendar; charset=utf-8');
    expect(response.headers.get('Content-Disposition')).toBe('inline; filename="rezept.ics"');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    const body = await response.text();
    expect(body).toContain('SUMMARY:Beispiel Suppe');
    expect(body).toContain('DTSTART;VALUE=DATE:20261019');
    expect(body).toContain('URL:https://example.test/recipes/recX1');
  });
});
