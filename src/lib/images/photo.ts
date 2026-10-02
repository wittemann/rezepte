// Rules for the photo taken at the end of cooking mode (docs/decisions/0005-image-handling.md).
// Shared by the browser, which shrinks the photo, and the upload action, which checks it.

/** Longest side of the uploaded photo in px (design/README.md, "Kochmodus"). */
export const MAX_PHOTO_SIDE = 1200;

export const PHOTO_JPEG_QUALITY = 0.85;

/**
 * Longest base64 text the action accepts. A 1200 px JPEG is a few hundred kB; this leaves plenty
 * of room and stays below Airtable's 5 MB per file and Vercel's 4.5 MB request body.
 */
export const MAX_PHOTO_BASE64_LENGTH = 3_000_000;

/** What a base64-encoded JPEG starts with (the bytes FF D8 FF). */
export const JPEG_BASE64_PREFIX = '/9j/';

/** Size that fits into `max` × `max` with the same proportions. Never enlarges. */
export function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
