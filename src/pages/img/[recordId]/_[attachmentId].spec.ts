import type { APIContext } from 'astro';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './[attachmentId].ts';

vi.mock('astro:env/server', () => ({ AIRTABLE_TOKEN: 'token', AIRTABLE_BASE_ID: 'appTest' }));

const getImageUrl = vi.hoisted(() => vi.fn());
vi.mock('../../../lib/recipes/repository.ts', () => ({ getImageUrl }));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  getImageUrl.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

function request(recordId: string, attachmentId: string, search = '') {
  return GET({
    params: { recordId, attachmentId },
    url: new URL(`https://example.test/img/${recordId}/${attachmentId}${search}`),
  } as unknown as APIContext);
}

describe('image route', () => {
  it('streams the image with long cache headers for browser and Vercel CDN', async () => {
    getImageUrl.mockResolvedValue('https://cdn.example.test/image');
    fetchMock.mockResolvedValue(
      new Response('bytes', { headers: { 'Content-Type': 'image/jpeg' } }),
    );

    const response = await request('recA1', 'attB2');

    expect(await response.text()).toBe('bytes');
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    const cache = 'public, max-age=31536000, immutable';
    expect(response.headers.get('Cache-Control')).toBe(cache);
    expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe(cache);
    expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'none'; sandbox");
    expect(getImageUrl).toHaveBeenCalledWith(
      { token: 'token', baseId: 'appTest' },
      'recA1',
      'attB2',
      'full',
    );
  });

  it('passes a known size on and ignores an unknown one', async () => {
    getImageUrl.mockResolvedValue(undefined);
    await request('recA1', 'attB2', '?size=small');
    await request('recA1', 'attB2', '?size=huge');
    expect(getImageUrl.mock.calls.map((call) => call[3])).toEqual(['small', 'full']);
  });

  it('answers 404 without cache headers for an unknown image', async () => {
    getImageUrl.mockResolvedValue(undefined);
    const response = await request('recA1', 'attB2');
    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBeNull();
  });

  it('answers 404 without asking Airtable when the IDs are malformed', async () => {
    expect((await request('recA1', '../x')).status).toBe(404);
    expect((await request('x', 'attB2')).status).toBe(404);
    expect(getImageUrl).not.toHaveBeenCalled();
  });

  it.each(['image/svg+xml', 'text/html', null])(
    'answers 502 without cache headers when Airtable sends %s',
    async (type) => {
      getImageUrl.mockResolvedValue('https://cdn.example.test/image');
      const headers: Record<string, string> = type ? { 'Content-Type': type } : {};
      fetchMock.mockResolvedValue(new Response('<svg/>', { headers }));
      const response = await request('recA1', 'attB2');
      expect(response.status).toBe(502);
      expect(response.headers.get('Cache-Control')).toBeNull();
    },
  );

  it('answers 502 without cache headers when the image can not be fetched', async () => {
    getImageUrl.mockResolvedValue('https://cdn.example.test/image');
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }));
    const response = await request('recA1', 'attB2');
    expect(response.status).toBe(502);
    expect(response.headers.get('Cache-Control')).toBeNull();
  });
});
