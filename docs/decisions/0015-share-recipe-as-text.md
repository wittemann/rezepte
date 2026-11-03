# 0015 – Share a recipe as text via the share sheet

**Status:** Proposed (2026-11-03)

## Context

Now and then someone outside the group asks for a recipe („Schickst du mir das Rezept?“). They don't have the password, and everything in the app is behind the login ([ADR 0004](0004-shared-password-auth.md)). The recipe should go out from the phone, in the chat or mail app the person already uses.

The options:

- **Text via the Web Share API** (`navigator.share`): the recipe as plain text in the iOS share sheet. Nothing new on the server, nothing public. No photo, simple formatting only
- **Public link** (e.g. `/s/<token>`, unguessable): a read-only recipe page without login. Has the photo and the design, but opens a hole in the login, needs a design and a way to revoke links, and makes recipe texts (partly copied from other sites) publicly reachable. Public links were already ruled out by the project owner for Bring ([ADR 0014](0014-bring-shopping-list.md))
- **PDF or image**: built on the server or in the browser. Heavy for what it's for, and not searchable or copyable for the recipient

## Decision

- **Plain text through the share sheet.** A button on the recipe page calls `navigator.share({ title, text })`. The text is built by a pure function from the `Recipe`, on the server (it doesn't depend on the serving scaler)
- **No share sheet** (`navigator.share` missing): the same button copies the text (`navigator.clipboard.writeText`) and shows a toast. Cancelling the share sheet (`AbortError`) does nothing
- **Text**, in this order; a part with no value is left out:
  1. Title
  2. Servings and times: „4 Portionen · Arbeitszeit 20 Min. · Gesamtzeit 1 Std.“ (`formatDuration`)
  3. „Zutaten“: one line per ingredient as written in the recipe (original servings, not scaled), `- ` in front of items, headings on their own line
  4. „Zubereitung“: section titles, steps numbered as on the recipe page, then the hint. Left out for ideas (recipes without instructions)
  5. „Notizen“: the notes
  6. Source and link: „Quelle: {Quelle}“ and the URL
- **Not in the text:** calories, photo, rating, favorite, a link to the app, a footer. Plain text only, no WhatsApp markup (`*bold*` shows up as asterisks in Messages and mail)

## Consequences

- No public surface, no change to auth or middleware, no new keys or storage, no Airtable calls beyond loading the page
- The recipient gets no photo and no design; the text is as tidy as the recipe's free text in Airtable
- The text contains the notes, which are sometimes personal; whoever shares sees the recipe page and decides
- The entry point needs a design (header card is full): brief [share](../design-briefs/share.md)

## To accept

Spike on the iPhone, in Safari and in the home-screen app (`display: standalone`, [ADR 0012](0012-pwa-and-timers.md)): a hard-coded `navigator.share({ title, text })` with a multi-line text opens the share sheet; the line breaks survive in Messages, WhatsApp and Mail; check whether Mail uses `title` as the subject and whether Messages shows the title twice. If the title shows twice, drop `title` and keep it only in the text.
