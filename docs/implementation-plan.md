# Implementation plan

Steps to build v1 as defined in [01-requirements](specs/01-requirements.md), following the design in `design/` ([05-design-integration](specs/05-design-integration.md)). An item is ticked off in the commit that completes it.

Legend: **(owner)** = needs the project owner (accounts, secrets, decisions, testing on the phone). `haiku` / `sonnet` / `opus` = the model to use for the sub-agent that builds the item (see "Sub-agents and models").

## How we work: every item goes through a manual review

Each item below is done only when it has passed these steps, in this order:

1. **Build:** Claude implements the item in a small, focused change (one item, or a few closely related ones). Logic comes with tests
2. **Check:** format, lint, type check, tests and build pass locally (`npm run format:check`, `lint`, `check`, `test`, `build`)
3. **Present:** Claude summarizes what changed and why, lists the files, reports the check results and points out what deserves a close look (tricky logic, new dependencies, security-relevant code, generated files). Visual changes are shown in the browser (dev server, Browser pane) so the reviewer can see them, not just read the diff, in light and dark mode
4. **Manual review (human developer):** read the diff until it's understood. Ask questions, request changes, or give an explicit OK. If a change is too big to follow, it gets split
5. **Commit:** only after the OK, one commit per reviewed change, with a message that explains why. The commit that completes an item also ticks it off here
6. **Push:** when the developer asks; CI then runs on GitHub

## Sub-agents and models

Open items are built by a sub-agent, not in the main session, to keep the main context small. The main session only briefs it, runs the checks and presents the result (steps 3–5 stay with the main session and the human reviewer; a sub-agent never commits).

- **Brief:** the plan item, the relevant specs/ADRs, the files to touch, "don't commit", and the check commands
- **Model per item** (the tag at the end of the line): `haiku` = small, mechanical, follows an existing pattern; `sonnet` = default, normal feature work; `opus` = tricky logic, security, caching, browser APIs or anything hard to review afterwards
- **Review before presenting:** as soon as the sub-agent is back, the main thread reviews the result (`/code-review` on the uncommitted changes, in a different model than the one that built it, so it doesn't repeat the same blind spots). Findings go back to a sub-agent to fix, then it is reviewed again. Repeat until nothing is left. Only then present to the human developer (step 3 below)
- Bump the model when a result needs rework; the tag is a starting point

## 1. Foundation

- [x] Add Preact: `@astrojs/preact` + `preact` (versions and options checked against current docs) — [ADR 0006](decisions/0006-forms-and-interactivity.md)
- [x] Self-hosted fonts: Fredoka 500/600, Nunito 400–800 (Astro Fonts API, Fontsource provider) — [ADR 0007](decisions/0007-styling-approach.md)
- [x] `src/styles/tokens.css`: colors light + dark (`prefers-color-scheme`), accent, pastel formula with category and meal hues, radii, outlines, hard shadows, spacing; sizes in `rem`
- [x] `src/styles/global.css`: base styles, body background, safe areas, focus styles, min. font size
- [x] Base layout: `lang="de"`, `viewport-fit=cover`, `theme-color` light/dark, apple-touch-icon
- [x] Maulti as a component (Preact, SVG from `Maskottchen.dc.html`, props `pose` × 8 incl. `lock`, `size`)
- [x] Icons: tab bar icons and category icons (`CAT_ICON` in the prototype)

## 2. Data layer

- [x] `lib/airtable/client.ts`: fetch client with auth header, pagination (`offset`), error mapping, one retry after 30 s on 429 — [ADR 0002](decisions/0002-airtable-as-source-of-truth.md)
- [x] `npm run airtable:schema`: print tables and fields with IDs (metadata API)
- [x] `lib/recipes/fields.ts`: table and field IDs from [03-data-model](specs/03-data-model.md); constants `CATEGORIES`, `MEALS` mapping the Airtable values to the English names used by the `--pastel-*` tokens and `Icon` (`Grillen` → `grill`, `Mittag & Abend` → `lunch-dinner`, …)
- [x] Ingredient parser: headings (`…:`), amounts (`1,5`, `2–3`, `ca.`; no fractions), units → `IngredientLine`
- [x] Serving scaler: factor, rounding (≥ 20 whole numbers, else ¼ steps with ¼ ½ ¾), ½-steps below 2 servings
- [x] Method parser: numbered steps, sections (`Teig:`), hint after the last step, timer extraction (`25 Minuten`, `1,5 Std.`, ranges → lower number)
- [x] Time helpers: Airtable seconds ⇄ minutes, display `20 Min.` / `1 Std. 5 Min.`, form input `h:mm`
- [x] Run the parsers against all real recipes (locally, output not committed) and fix what they don't understand; adjust the data conventions if needed
- [x] `lib/recipes/repository.ts`, reading: `getAll`, `getById` with zod validation, tolerant reads
- [x] `lib/recipes/repository.ts`, writing: `create`, `update` with `PATCH` + `typecast`, never writing computed fields
- [x] Search (name and ingredients, name matches first) and filters (meal, category, ≤ 30 min, with instructions)
- [x] Suggestions: matching meal, time limit (30/90 min, unknown time counts as matching), deterministic shuffle by day + meal + dice seed, max. 6

## 3. Auth and monitoring

- [x] `lib/auth/session.ts`: cookie `<issuedAt>.<HMAC>` sign/verify, constant-time compare — [04-auth](specs/04-auth.md)
- [x] `src/middleware.ts`: redirect to `/login?next=…` without a valid session; skip `/login` and static assets
- [x] Login page as designed (`design/README.md`, „0. Login“): Maulti `lock`/`think`, show/hide toggle, error state; login action with ~500 ms delay on failure; `next` only allows local paths
- [x] **(owner)** Login screen design from Claude Design (added 2026-09-26)

**Monitoring** (early, so errors during development are visible)

- [ ] **(owner)** Create the Sentry account (EU region) and project; add `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` to Vercel — [ADR 0009](decisions/0009-error-monitoring.md)
- [ ] `@sentry/astro`: errors + replay on error, inputs masked, login POST scrubbed, explicit reports for Airtable errors, 429s and skipped records · `opus`

## 4. App shell and shared components

- [x] Desktop: limit the app to about one iPhone width (≈ 430 px, in `rem`), centered, as a token; fixed elements (tab bar, bottom sheet, sticky CTA, timer pill) stay within it. The design only covers the phone (390 × 844); on wide screens the login column currently stretches across the whole window · `sonnet`
- [x] Floating tab bar: Start · Rezepte · Favoriten · Neu as in `design/README.md` and the screenshots, not the prototype code ([05-design-integration](specs/05-design-integration.md), Rules); active state, safe-area aware; page padding for it. Open: color of the filled heart when Favoriten is active (README: `ink`, prototype code: accent) · `sonnet`
- [x] Recipe row (photo or initial tile, name, meta, heart; the prototype draws this heart filled without outline) · `sonnet`
- [x] Pills and chips, segmented control, buttons (primary/round/outline), speech bubble, meta sticker · `sonnet`
- [x] Bottom sheet (filter sheet, ingredients in cooking mode) · `opus`
- [x] Toast ("Gespeichert") · `haiku`
- [x] Plain error pages: 404 ("Seite nicht gefunden") and 500 ("Da ist was schiefgelaufen"), tokens only, no design · `haiku`
- [x] Use `type` instead of `interface`: enable `@typescript-eslint/consistent-type-definitions: ['error', 'type']`, run `--fix`, convert the `extends` chain in `Button.astro` by hand (intersections), add the convention to `CLAUDE.md` · `haiku`
- [x] Remove redundant explicit return types (rule in `CLAUDE.md`): delete where inference gives the same type (checked by comparing the emitted `.d.ts` before and after), where it widened a type, fix the returned value instead (`as const`, a cast to the named type). Forbid them in `eslint.config.js` (`no-restricted-syntax` on a function's `returnType`) · `haiku`
- [x] **(owner)** Create the field `Favorit seit` (dateTime, with time) in the Airtable table `Rezepte`; the field ID goes into [03-data-model](specs/03-data-model.md)
- [x] Map `favoritedAt` (`fields.ts`, `record.ts`, `recipe.ts`) with tests; sorting helper "newest first" · `sonnet`
- [x] Action `setFavorite` (sets the state instead of toggling; login-protected by the middleware; writes `Favorit seit` = now or empty) · `sonnet`
- [x] `FavoriteButton` island: heart, optimistic update, rollback + toast on error; wire the real `favorite` prop into the recipe row · `sonnet`

## 5. Screens

**Recipes and favorites**

- [x] Recipes page: title + count, search field (≥ 16 px against iOS zoom), meal segmented control, filter button with count · `sonnet`
- [x] Filter sheet: category chips, "Bis 30 Min.", "Mit Anleitung", reset, "N Rezepte anzeigen" · `sonnet`
- [x] Grouped by category without search; flat hit list with search; empty state (Maulti `think`) · `sonnet`
- [ ] Favorites page; empty state (Maulti `sleep`) · `haiku`

**Recipe detail**

- [ ] Image proxy route `/img/[recordId]/[attachmentId]` with long cache headers — [ADR 0005](decisions/0005-image-handling.md). The middleware checks the login for uncached requests only; verify which headers make the Vercel CDN cache a function response · `opus`
- [ ] Header card in category color: back, heart, "Bearbeiten", optional photo, category, title, source link, Maulti (`heart`/`wave`) · `sonnet`
- [ ] Unknown recipe id: the detail page renders `ErrorMessage` with "Rezept nicht gefunden" and status 404 (the generic 404 page only says "Seite nicht gefunden") · `haiku`
- [ ] Meta stickers (Arbeitszeit, Gesamtzeit, kcal/Portion) · `haiku`
- [ ] Ingredients with serving scaler (island) · `sonnet`
- [ ] Steps "So geht's" with sections, number circles, timer chips; hint box; notes expandable · `sonnet`
- [ ] Stub state: "Noch ohne Anleitung" + "Rezept ergänzen" · `haiku`
- [ ] Sticky CTA "Los, wir kochen!" · `haiku`

**End-to-end tests** (as soon as login → list → detail works, [ADR 0010](decisions/0010-e2e-tests-deferred.md); details in section 7)

- [ ] Set up Playwright: config, `npm run test:e2e`, dev server started by the config, login helper using a test password hash and session secret from a local `.env` (never committed); Chromium only, phone viewport; CI job in the workflow from [ADR 0008](decisions/0008-tooling.md) with secrets from GitHub · `sonnet`
- [ ] Smoke test: login (wrong password shows the error, right one gets in) → recipes list → first recipe detail · `sonnet`

**Start**

- [ ] Greeting by time of day with Maulti `wave` and speech bubble · `haiku`
- [ ] Meal tiles and time segmented control with defaults (before 11 → Frühstück; Mon–Fri → Wenig Zeit) · `sonnet`
- [ ] Suggestion carousel (scroll-snap, tilted cards, "Nochmal würfeln", empty state) · `sonnet`
- [ ] Favorites preview (max. 4) and "Stöbern" category grid linking to the filtered list · `sonnet`

**Cooking mode**

- [ ] Step view: close, progress dots, ingredients sheet (scaled), Maulti `cook`, step card with section label · `sonnet`
- [ ] Swipe (50 px threshold) and buttons ← / Weiter / Fertig · `sonnet`
- [ ] Screen Wake Lock while cooking · `haiku`
- [ ] Timers: several in parallel, persisted across pages, pill at the top, alarm overlay (Maulti `alarm`) with sound and vibration — [ADR 0012](decisions/0012-pwa-and-timers.md) · `opus`
- [ ] Photo step for recipes without a photo: camera input, resize to max. 1200 px, upload action to Airtable's upload-attachment endpoint (verify current API) · `opus`

**Edit and new**

- [ ] One form for both: name, category chips, meals (multiple), servings, times (`h:mm`), ingredients and instructions with help text, source, link, notes; "Sichern" disabled without a name · `sonnet`
- [ ] Astro Action with zod: create or `PATCH` only the app's fields; redirect to the detail page; toast "Gespeichert" · `sonnet`
- [ ] Hint "Änderungen sind für alle in der Familie sichtbar." · `haiku`

## 6. Installable app

- [ ] `manifest.webmanifest` (name „Kochbuch“, `standalone`, theme `#fff6e8`) and icons 192/512 px generated from the Maulti SVG, plus the existing 180 px icon; manifest link in `Base.astro` · `sonnet`
- [ ] Replace `favicon.svg` / `favicon.ico` (still Astro's default logo) with Maulti · `haiku`

## 7. End-to-end tests (rest)

Setup and smoke test are in section 5, right after the recipe detail. Playwright against a local dev server with the real Airtable base, read-only ([ADR 0010](decisions/0010-e2e-tests-deferred.md)). Tests never write and never contain recipe names or texts (the repo is public): they pick whatever the first recipe is.

- [ ] Added with their screens: search and filter, favorites, start suggestions, cooking mode with timers · `sonnet`
- [ ] Edit and new recipe: needs a test base or a cleanup step, since it writes; decide when we get there · `opus`

## 8. Quality passes

- [ ] Accessibility pass: keyboard, contrast, 44 px targets, large system text size · `sonnet`
- [ ] Performance check on a phone over mobile data (target ≈ 1 s per page) · `sonnet`
- [ ] Dark mode pass on every screen · `sonnet`

## 9. Project-wide reviews

Run after all screens and section 8 are done, before launch. Each review is a read-only sub-agent over the whole project; all run in parallel in one go.

- **Brief:** the area, the relevant specs/ADRs, "read-only, don't edit or commit", "no recipe names or texts in the report" (the repo is public)
- **Report:** a findings list, each with file:line, what's wrong, why it matters, suggested fix and severity: **blocker** (fix before launch), **should fix**, **nice to have**. Most severe first; "nothing found" is a valid result
- **Afterwards:** the main session merges the reports, drops duplicates and false positives, and presents them to the human developer. Accepted findings become new items in this plan and are fixed in small, separately reviewed commits (the usual steps). Nothing is fixed inside the review run
- Model tag = the sub-agent doing the review; bump it if a report looks shallow

- [ ] Security: auth and session handling, middleware coverage, open redirects, input validation and Airtable formula injection on the write path, secrets, security headers, image proxy abuse, error leaks · `opus`
- [ ] Architecture: layering (`lib` vs components vs pages), data flow, caching and rendering per [ADR 0003](decisions/0003-rendering-and-caching.md), coupling to Airtable, resilience when Airtable is down or rate-limited · `opus`
- [ ] File structure: folder layout, naming, co-located specs/texts/styles, dead or misplaced files · `haiku`
- [ ] General code quality: bugs, error handling, edge cases, duplication, type safety, lint-clean but questionable patterns · `sonnet`
- [ ] Maintainability / readability: plain names (no abbreviations), short functions, comments only where the reason isn't obvious, UI texts in `.texts.ts` files · `sonnet`
- [ ] Spec/ADR conformance: code matches `docs/specs/` and the ADRs; statuses in `docs/README.md` are true; no `Proposed`/`Open` decision still being built on; docs match reality (env vars, commands) · `sonnet`
- [ ] Design fidelity: every screen against `design/` (variant `playful`) and [05-design-integration](specs/05-design-integration.md); hardcoded values instead of tokens; light and dark · `sonnet`
- [ ] Performance: bundle size, hydrated islands, image handling per [ADR 0005](decisions/0005-image-handling.md), cache headers, Airtable calls per page, Vercel free-tier limits · `sonnet`
- [ ] Dependencies: `npm audit`, outdated and unused packages, licenses, lockfile sanity, versions against current docs · `haiku`
- [ ] Test quality: coverage gaps, brittle or flaky tests, tests that check implementation instead of behavior, missing edge cases in parsers and scaler · `sonnet`

## 10. Launch

- [ ] **(owner)** Check the repo and Vercel settings from [ADR 0008](decisions/0008-tooling.md) and [06-deployment](specs/06-deployment.md): GitHub secret scanning and push protection on, Dependabot security updates on, Vercel fork-build protection on, all production env vars set
- [ ] **(owner)** Test on the iPhone: add to home screen, cook one recipe end to end (timers, photo step, edit)
- [ ] **(owner)** Share the URL and passphrase with family and friends
- [ ] **(owner, later)** Custom domain — [ADR 0011](decisions/0011-custom-domain.md)

## Later (not v1)

See "Later" in [01-requirements](specs/01-requirements.md): timer push notifications, shopping list, deleting recipes in the app, logout button, offline use, a lighter outline for Maulti in dark mode.
