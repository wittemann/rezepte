# Implementation plan

Steps to build v1 as defined in [01-requirements](specs/01-requirements.md), following the design in `design/` ([05-design-integration](specs/05-design-integration.md)). Tick items off as they land on `main`.

Legend: **(owner)** = needs the project owner (accounts, secrets, decisions, testing on the phone).

## How we work: every item goes through a manual review

Each item below is done only when it has passed these steps, in this order:

1. **Build:** Claude implements the item in a small, focused change (one item, or a few closely related ones). Logic comes with tests
2. **Check:** format, lint, type check, tests and build pass locally (`npm run format:check`, `lint`, `check`, `test`, `build`)
3. **Present:** Claude summarizes what changed and why, lists the files, reports the check results and points out what deserves a close look (tricky logic, new dependencies, security-relevant code, generated files)
4. **Manual review (human developer):** read the diff until it's understood. Ask questions, request changes, or give an explicit OK. If a change is too big to follow, it gets split
5. **Commit:** only after the OK, one commit per reviewed change, with a message that explains why
6. **Push:** when the developer asks; CI then runs on GitHub. Tick the item off here in the same or the next commit

## 1. Foundation

- [x] Add Preact: `@astrojs/preact` + `preact` (versions and options checked against current docs) — [ADR 0006](decisions/0006-forms-and-interactivity.md)
- [x] Self-hosted fonts: Fredoka 500/600, Nunito 400–800 (Astro Fonts API, Fontsource provider) — [ADR 0007](decisions/0007-styling-approach.md)
- [x] `src/styles/tokens.css`: colors light + dark (`prefers-color-scheme`), accent, pastel formula with category and meal hues, radii, outlines, hard shadows, spacing; sizes in `rem`
- [ ] `src/styles/global.css`: base styles, body background, safe areas, focus styles, min. font size
- [ ] Base layout: `lang="de"`, `viewport-fit=cover`, `theme-color` light/dark, apple-touch-icon, manifest link
- [ ] Maulti as a component (SVG from `Maskottchen.dc.html`, props `pose` × 8 incl. `lock`, `size`)
- [ ] Icons: tab bar icons and category icons (`CAT_ICON` in the prototype)

## 2. Data layer

- [ ] `lib/airtable/client.ts`: fetch client with auth header, pagination (`offset`), error mapping, one retry after 30 s on 429 — [ADR 0002](decisions/0002-airtable-as-source-of-truth.md)
- [ ] `npm run airtable:schema`: print tables and fields with IDs (metadata API)
- [ ] `lib/recipes/fields.ts`: table and field IDs from [03-data-model](specs/03-data-model.md); constants `CATEGORIES`, `MEALS` with hues
- [ ] Ingredient parser: headings (`…:`), amounts (`1,5`, `½`, `1/2`, `2–3`, `ca.`), units → `IngredientLine`
- [ ] Serving scaler: factor, rounding (≥ 20 whole numbers, else ¼ steps with ¼ ½ ¾), ½-steps below 2 servings
- [ ] Method parser: numbered steps, sections (`Teig:`), hint after the last step, timer extraction (`25 Minuten`, `1,5 Std.`, ranges → lower number)
- [ ] Time helpers: Airtable seconds ⇄ minutes, display `20 Min.` / `1 Std. 5 Min.`, form input `h:mm`
- [ ] Run the parsers against all 95 real recipes (locally, output not committed) and fix what they don't understand; adjust the data conventions if needed
- [ ] `lib/recipes/repository.ts`: `getAll`, `getById`, `create`, `update` with zod validation, tolerant reads, `PATCH` + `typecast`, never writing computed fields
- [ ] Search (name and ingredients, name matches first) and filters (meal, category, ≤ 30 min, with instructions)
- [ ] Suggestions: matching meal, time limit (30/90 min, unknown time counts as matching), deterministic shuffle by day + meal + dice seed, max. 6

## 3. Auth

- [x] `lib/auth/session.ts`: cookie `<issuedAt>.<HMAC>` sign/verify, constant-time compare — [04-auth](specs/04-auth.md)
- [x] `src/middleware.ts`: redirect to `/login?next=…` without a valid session; skip `/login` and static assets
- [ ] Login page as designed (`design/README.md`, „0. Login“): Maulti `lock`/`think`, show/hide toggle, error state; login action with ~500 ms delay on failure; `next` only allows local paths
- [x] **(owner)** Login screen design from Claude Design (added 2026-09-26)
- [ ] **(owner)** Share the passphrase with the family

## 4. App shell and shared components

- [ ] Floating tab bar: Start · Rezepte · Favoriten · Neu, active state, safe-area aware; page padding for it
- [ ] Recipe row (photo or initial tile, name, meta, heart)
- [ ] Pills and chips, segmented control, buttons (primary/round/outline), speech bubble, meta sticker
- [ ] Bottom sheet (filter sheet, ingredients in cooking mode)
- [ ] Toast ("Gespeichert")
- [ ] Plain error pages: 404 ("Rezept nicht gefunden") and 500 ("Da ist was schiefgelaufen"), tokens only, no design
- [ ] Favorites store: `localStorage`, most recently added first, shared by all islands

## 5. Screens

**Recipes and favorites**

- [ ] Recipes page: title + count, search field (≥ 16 px against iOS zoom), meal segmented control, filter button with count
- [ ] Filter sheet: category chips, "Bis 30 Min.", "Mit Anleitung", reset, "N Rezepte anzeigen"
- [ ] Grouped by category without search; flat hit list with search; empty state (Maulti `think`)
- [ ] Favorites page; empty state (Maulti `sleep`)

**Recipe detail**

- [ ] Image proxy route `/img/[recordId]/[attachmentId]` with long cache headers — [ADR 0005](decisions/0005-image-handling.md)
- [ ] Header card in category color: back, heart, "Bearbeiten", optional photo, category, title, source link, Maulti (`heart`/`wave`)
- [ ] Meta stickers (Arbeitszeit, Gesamtzeit, kcal/Portion)
- [ ] Ingredients with serving scaler (island)
- [ ] Steps "So geht's" with sections, number circles, timer chips; hint box; notes expandable
- [ ] Stub state: "Noch ohne Anleitung" + "Rezept ergänzen"
- [ ] Sticky CTA "Los, wir kochen!"

**Start**

- [ ] Greeting by time of day with Maulti `wave` and speech bubble
- [ ] Meal tiles and time segmented control with defaults (before 11 → Frühstück; Mon–Fri → Wenig Zeit)
- [ ] Suggestion carousel (scroll-snap, tilted cards, "Nochmal würfeln", empty state)
- [ ] Favorites preview (max. 4) and "Stöbern" category grid linking to the filtered list

**Cooking mode**

- [ ] Step view: close, progress dots, ingredients sheet (scaled), Maulti `cook`, step card with section label
- [ ] Swipe (50 px threshold) and buttons ← / Weiter / Fertig
- [ ] Screen Wake Lock while cooking
- [ ] Timers: several in parallel, persisted across pages, pill at the top, alarm overlay (Maulti `alarm`) with sound and vibration — [ADR 0012](decisions/0012-pwa-and-timers.md)
- [ ] Photo step for recipes without a photo: camera input, resize to max. 1200 px, upload action to Airtable's upload-attachment endpoint (verify current API)

**Edit and new**

- [ ] One form for both: name, category chips, meals (multiple), servings, times (`h:mm`), ingredients and instructions with help text, source, link, notes; "Sichern" disabled without a name
- [ ] Astro Action with zod: create or `PATCH` only the app's fields; redirect to the detail page; toast "Gespeichert"
- [ ] Hint "Änderungen sind für alle in der Familie sichtbar."

## 6. Installable app

- [ ] `manifest.webmanifest` (name „Kochbuch“, `standalone`, theme `#fff6e8`) and icons 192/512 px generated from the Maulti SVG, plus the existing 180 px icon

## 7. Monitoring and quality

- [ ] **(owner)** Create the Sentry account (EU region) and project; add `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` to Vercel — [ADR 0009](decisions/0009-error-monitoring.md)
- [ ] `@sentry/astro`: errors + replay on error, inputs masked, login POST scrubbed, explicit reports for Airtable errors, 429s and skipped records
- [ ] Accessibility pass: keyboard, contrast, 44 px targets, large system text size
- [ ] Performance check on a phone over mobile data (target ≈ 1 s per page)
- [ ] Dark mode pass on every screen

## 8. Launch

- [ ] **(owner)** Test on the iPhone: add to home screen, cook one recipe end to end (timers, photo step, edit)
- [ ] **(owner)** Share the URL and passphrase with family and friends
- [ ] **(owner, later)** Custom domain — [ADR 0011](decisions/0011-custom-domain.md)

## Later (not v1)

See "Later" in [01-requirements](specs/01-requirements.md): timer push notifications, shopping list, deleting recipes in the app, offline use.
