// Image proxy (docs/decisions/0005-image-handling.md): looks up the Airtable URL in the table copy
// (renewing it once if it has expired, see ADR 0003) and streams the image, so pages never contain
// Airtable's expiring URLs.
//
// Caching: an attachment ID never changes content, so the response may be cached for a year.
// `Vercel-CDN-Cache-Control` makes the Vercel CDN keep it (the CDN doesn't act on max-age in
// `Cache-Control` alone); `Cache-Control` is for the browser. The middleware checks the login only
// when the function runs, so a cached image is served without it (accepted in ADR 0005).
import type { APIRoute } from 'astro';
import { AIRTABLE_BASE_ID, AIRTABLE_TOKEN } from 'astro:env/server';
import { isRecordId } from '../../../lib/airtable/client.ts';
import {
  IMAGE_SIZES,
  isAttachmentId,
  isPhotoType,
  type ImageSize,
} from '../../../lib/recipes/image-source.ts';
import { getImageUrl, refreshImageUrl } from '../../../lib/recipes/repository.ts';

const CACHE_FOR_A_YEAR = 'public, max-age=31536000, immutable';

function toSize(value: string | null) {
  return IMAGE_SIZES.find((size) => size === value) ?? ('full' as ImageSize);
}

export const GET: APIRoute = async ({ params, url }) => {
  const { recordId = '', attachmentId = '' } = params;
  // Nothing but real IDs reaches Airtable
  if (!isRecordId(recordId) || !isAttachmentId(attachmentId)) return notFound();

  const connection = { token: AIRTABLE_TOKEN, baseId: AIRTABLE_BASE_ID };
  const size = toSize(url.searchParams.get('size'));
  const imageUrl = await getImageUrl(connection, recordId, attachmentId, size);
  if (!imageUrl) return notFound();

  let upstream = await fetch(imageUrl);
  // A 4xx most likely means the URL from the table copy has expired: try once with a fresh one
  if (upstream.status >= 400 && upstream.status < 500) {
    const freshUrl = await refreshImageUrl(connection, recordId, attachmentId, size);
    if (!freshUrl) return notFound();
    upstream = await fetch(freshUrl);
  }
  const contentType = upstream.headers.get('Content-Type');
  // Checked again on the answer: Airtable's type for the attachment could differ from the file's
  if (!upstream.ok || !upstream.body || !isPhotoType(contentType)) {
    return new Response(null, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': CACHE_FOR_A_YEAR,
      'Vercel-CDN-Cache-Control': CACHE_FOR_A_YEAR,
      'X-Content-Type-Options': 'nosniff',
      // Even if a file got through: opened directly, it can't load or run anything
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
};

// No cache headers: an image added later must show up
function notFound() {
  return new Response(null, { status: 404 });
}
