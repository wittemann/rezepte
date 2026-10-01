// Image proxy (docs/decisions/0005-image-handling.md): looks up a fresh Airtable URL and streams
// the image, so pages never contain Airtable's expiring URLs.
//
// Caching: an attachment ID never changes content, so the response may be cached for a year.
// `Vercel-CDN-Cache-Control` makes the Vercel CDN keep it (the CDN doesn't act on max-age in
// `Cache-Control` alone); `Cache-Control` is for the browser. The middleware checks the login only
// when the function runs, so a cached image is served without it (accepted in ADR 0005).
import type { APIRoute } from 'astro';
import { AIRTABLE_BASE_ID, AIRTABLE_TOKEN } from 'astro:env/server';
import { isRecordId } from '../../../lib/airtable/client.ts';
import { IMAGE_SIZES, isAttachmentId, type ImageSize } from '../../../lib/recipes/image-source.ts';
import { getImageUrl } from '../../../lib/recipes/repository.ts';

const CACHE_FOR_A_YEAR = 'public, max-age=31536000, immutable';

function toSize(value: string | null) {
  return IMAGE_SIZES.find((size) => size === value) ?? ('full' as ImageSize);
}

export const GET: APIRoute = async ({ params, url }) => {
  const { recordId = '', attachmentId = '' } = params;
  // Nothing but real IDs reaches Airtable
  if (!isRecordId(recordId) || !isAttachmentId(attachmentId)) return notFound();

  const imageUrl = await getImageUrl(
    { token: AIRTABLE_TOKEN, baseId: AIRTABLE_BASE_ID },
    recordId,
    attachmentId,
    toSize(url.searchParams.get('size')),
  );
  if (!imageUrl) return notFound();

  const upstream = await fetch(imageUrl);
  if (!upstream.ok || !upstream.body) return new Response(null, { status: 502 });

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
      'Cache-Control': CACHE_FOR_A_YEAR,
      'Vercel-CDN-Cache-Control': CACHE_FOR_A_YEAR,
      'X-Content-Type-Options': 'nosniff',
    },
  });
};

// No cache headers: an image added later must show up
function notFound() {
  return new Response(null, { status: 404 });
}
