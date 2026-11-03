# Design brief: share a recipe

For Claude Design, as an addition to the existing handoff („Kochbuch-App Maulti“, variant `playful` only, incl. sections „8. Bewertung“ and „9. Einkaufsliste“). UI texts are German; the rest of this brief is English.

## Context

- Family cookbook, one shared password, no user accounts.
- New: send a recipe to someone **outside** the group, who can't open the app. The recipe goes out as plain text through the iOS share sheet (Messages, WhatsApp, Mail, …). The app shows no preview of the text and no sheet of its own: one tap opens the system share sheet. Background: [ADR 0015](../decisions/0015-share-recipe-as-text.md).
- Where there is no share sheet (some desktop browsers), the same button copies the text and shows a toast.
- The recipe page today, top to bottom: header card (back, heart, calendar button, „Bearbeiten“, star rating, optional photo, category pill, title, „von {Quelle}“, Maulti), meta stickers, ingredients with the servings stepper, button „Auf die Einkaufsliste“, steps, notes, „Los, wir kochen!“. Recipes without instructions („Stubs“) are shared too.

## What to design

### 1. Entry point on the recipe page

- A button that opens the share sheet. The header card is already full (back, heart, calendar, „Bearbeiten“, stars); find a place that fits, in or outside the header card.
- Icon and/or label: iOS users know the share icon (square with an arrow up). Give the German label (suggestion: „Rezept teilen“) and the screen reader label.
- Shown on every recipe, stubs included.

### 2. Copied (no share sheet)

- Toast like the heart's and Bring's (pill `ink`/`bg`, above the CTA): please give the text (suggestion: „Rezept kopiert“).
- Error, if copying fails: toast text (suggestion: „Kopieren hat nicht geklappt“).
- Cancelling the share sheet: nothing happens, no toast.

## States and rules

- Light and dark mode (dark follows the system).
- Touch target at least 44 px. Sizes in rem, layouts must hold with large system text.
- Maulti: no new pose needed.

## Deliverables

- Updated prototype (branch `isPlay`), new section in `README.md` with sizes, texts and behavior as for the other screens.
- Screenshots (390 × 844): recipe page with the entry point (with and without photo), the copied toast; dark mode for the recipe page.
- No recipe data in the handoff files that go into the repo (the repo is public). Use made-up example recipes.
