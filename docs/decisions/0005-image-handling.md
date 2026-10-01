# 0005 – Images: Airtable attachments behind an image proxy, upload in the app

**Status:** Accepted

## Context

Recipe images are Airtable attachments today, and Airtable stays the source of truth (ADR 0002). But Airtable attachment URLs **expire after a few hours**, and the originals are often large phone photos. The app should also be able to add photos, for example straight from the phone camera.

## Decision

**Display: image proxy**

- Route `/img/[recordId]/[attachmentId]` (optionally `?size=small|large|full`)
- Fetches the record, finds the attachment, streams either the image or one of Airtable's thumbnails (`small`/`large`) for lists
- Response headers: `Cache-Control: public, max-age=31536000, immutable` for the browser and the same value in `Vercel-CDN-Cache-Control` for the Vercel CDN (verified against the Vercel docs 2026-10-01; a function response is cached by the CDN only with a CDN header such as this or `s-maxage`). This is safe because an attachment id never changes content: replacing an image creates a new attachment id
- The domain type `RecipeImage.url` always points to this route, never to Airtable

**Upload: in the app, into Airtable**

- Upload through Airtable's upload-attachment endpoint (content API; the file is sent base64-encoded, **max 5 MB per file**)
- Resize and compress in the browser before upload to **max. 1200 px** on the longer side (JPEG/WebP, value from the design), so phone photos stay well under the limit and pages load fast
- Where uploads happen (design): the photo step at the end of cooking mode, for recipes without a photo
- Delete or replace = update the attachment field on the record

Verify the endpoint details (URL, payload, limits) against the current Airtable API docs at implementation time.

## Consequences

- Airtable stays the only storage. Images added in Airtable directly just work
- Each image costs one Airtable call per CDN cache miss; after that, it's served from the Vercel CDN
- Cached images are served by the CDN **without the login check**. Confirmed by the project owner (2026-09-26): URLs contain unguessable record and attachment ids, and recipe photos aren't sensitive
- Image upload needs a bit of client JS (resize before upload). It'll be an island, see ADR 0006
