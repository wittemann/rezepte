// Finds the current Airtable URL of one image. Airtable attachment URLs expire after a few hours,
// so the image route looks it up on every cache miss (docs/decisions/0005-image-handling.md).

import { z } from 'zod';
import { RECIPE_FIELDS } from './fields.ts';

/** "small" and "large" are Airtable's thumbnails (for lists), "full" is the original. */
export const IMAGE_SIZES = ['small', 'large', 'full'] as const;

export type ImageSize = (typeof IMAGE_SIZES)[number];

/** An app image URL (RecipeImage.url) in another size. */
export function sizedImageUrl(url: string, size: ImageSize) {
  return size === 'full' ? url : `${url}?size=${size}`;
}

// Airtable attachment IDs: "att" followed by letters and digits.
const ATTACHMENT_ID = /^att[A-Za-z0-9]+$/;

// Raster formats only. Not SVG: opened directly from our domain, an SVG could run scripts there.
const PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];

/** Whether a MIME type (parameters like `; charset` ignored) is a photo the app may serve. */
export function isPhotoType(type: string | null | undefined): type is string {
  const mimeType = type?.split(';')[0].trim().toLowerCase();
  return mimeType !== undefined && PHOTO_TYPES.includes(mimeType);
}

/** Whether `id` looks like an Airtable attachment ID. */
export function isAttachmentId(id: string) {
  return ATTACHMENT_ID.test(id);
}

const thumbnailSchema = z.object({ url: z.url() });

const attachmentsSchema = z.array(
  z.object({
    id: z.string(),
    type: z.string().optional(),
    url: z.url(),
    thumbnails: z.object({ small: thumbnailSchema, large: thumbnailSchema }).partial().optional(),
  }),
);

/**
 * The URL to fetch the image from, or undefined if the record has no photo attachment with this
 * ID (see isPhotoType). A missing thumbnail (Airtable only makes them for some file types) falls back to the original.
 */
export function findImageUrl(
  fields: Record<string, unknown>,
  attachmentId: string,
  size: ImageSize,
) {
  const attachments = attachmentsSchema.safeParse(fields[RECIPE_FIELDS.images]);
  if (!attachments.success) return undefined;
  const attachment = attachments.data.find((candidate) => candidate.id === attachmentId);
  if (!isPhotoType(attachment?.type)) return undefined;
  if (size === 'full') return attachment.url;
  return attachment.thumbnails?.[size]?.url ?? attachment.url;
}
