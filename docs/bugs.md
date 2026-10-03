# Bugs

Known bugs, found while using the app. Fixed like every other change: small commit, manual review ([implementation-plan](implementation-plan.md), "How we work"). A fixed bug is ticked off in the commit that fixes it; a bug with a visible effect gets a test that would have caught it, where feasible. `sonnet` etc. = the model to use, as in the plan.

- [ ] Back button on the recipe page always goes to `/rezepte`, also when coming from the start page (or favorites). Go back to where the user came from, with `/rezepte` as the fallback for a direct visit · `sonnet`
- [x] Home-screen app on iPhone: the page headline sits under the iOS status bar blur (seen on Rezepte list); fix top clearance, check on device · `sonnet`
- [x] Double-tap zoom on the servings stepper: tapping − or + quickly zooms the page on iOS. Add `touch-action: manipulation` to the stepper buttons (or globally to buttons and links); check other quickly tapped controls · `haiku`
- [x] Recipe page scrolls sideways: the page must never be wider than the screen. Not reproducible in the browser at 375 px with normal text; with a very large system text size the servings stepper pushes past the right edge. Find the cause on a real iPhone, then check all screens with large text · `sonnet`
- [x] Timer pill covers the cooking-mode header: while a timer runs, the pill (fixed at the top) sits over the „Zutaten“ button (can't be tapped) and the step indicator. Reserve header space while timers run or move the pill below the header · `sonnet`
- [x] Soft blur at the top of every page in the home-screen app (seen in cooking mode with a timer pill). Unclear if it's the pill's `--shadow-float` or the iOS 26 status-bar effect; check on a page without a timer first, then try `apple-mobile-web-app-status-bar-style` (verify against current docs) · `sonnet`
- [x] Swipe between steps doesn't work on the phone in cooking mode (the buttons do). Reproduce on a real iPhone (home-screen app and Safari), find why the touch handlers don't fire (e.g. `touch-action`, scrolling, or the pointer events used), then fix and add a test where feasible · `opus`
- [x] Cooking mode is taller than the screen when there's a top inset (home-screen app on iPhone): `CookingMode.module.css` sets `min-height: 100dvh` and `body` adds the `--safe-top` padding on top, so the page scrolls and the bottom buttons can be cut off. Subtract the inset (as `ErrorMessage.astro` does); check `LoginForm.module.css` too, which has the same pattern · `sonnet`
- [ ] Filter sheet on iPhone (seen in dark mode): „Zurücksetzen“ shows the accent focus ring right after the sheet opens. Likely `showModal()` focusing the first focusable element, which Safari then treats as `:focus-visible`. Reproduce on the iPhone, then e.g. give the dialog (or its title) `autofocus`/`tabindex=-1` so no button gets the ring on open; check the ingredients sheet in cooking mode and the timer alarm dialog („Alles klar“ gets the ring too) · `sonnet`

## From the project-wide reviews (2026-10-02)

Findings of the section 9 reviews in [implementation-plan](implementation-plan.md), merged and deduplicated. Severity as in the reviews: **blocker** = fix before launch, **should fix**, **nice to have**. Security findings are added here only with their fix (the repo is public).

### Blocker

- [ ] **Airtable monthly API cap:** the free plan allows 1,000 API calls per workspace per month; without a cache (ADR 0003) every page view costs at least 1 call, every write 2, plus image cache misses and CI e2e runs, so the budget lasts days. Check the workspace plan first; on Free, add a short server cache of the recipe table cleared on every write (update ADR 0003) or move to a paid plan. Either way, tell a quota 429 from a rate-limit 429 and fail fast instead of waiting 30 s · `opus`

### Should fix

- [ ] **Timer durations parsed wrongly** (`method.ts`): „1/2 Stunde“ → 120 min, „1 1/2 Std.“ → 120, „1 Stunde 15 Minuten“ → 60, „1 Std. 30 Min.“ → 60, „20 bis 25 Minuten“ → 25. Fix with tests for fractions, mixed numbers, compound times and ranges · `sonnet`
- [ ] **Mixed numbers scale wrongly** (`ingredients.ts`): „1 1/2 TL“ and „1 ½ EL“ scale only the 1 (doubled: „2 ½“), against the data convention; `scaleAmount(0, 2)` returns 0.1. Fix with tests · `sonnet`
- [ ] **Edit form loses data** (`form.ts`, `input.ts`, `RecipeForm.tsx`): categories and sources outside the fixed lists are saved as empty, unknown meals are dropped (ADR 0002 allows new ones); servings like 2,5 and non-whole-minute durations can't be saved. The form tests assert this behavior and need to change too · `opus`
- [ ] **Edit overwrites all fields** (last write wins): the PATCH sends every field from the loaded values, so two people editing at once lose changes. Send only changed fields, or at least document it · `sonnet`
- [ ] **Double tap on „Sichern“ creates two recipes:** no submit-in-progress guard in the new/edit form · `sonnet`
- [ ] **FavoriteButton error handling:** a rejected fetch (offline) or an expired session leaves the heart flipped with no toast; two quick taps race and the rollback uses a stale value · `sonnet`
- [ ] **Photos above ~750 KB fail:** Astro's action body limit (1 MiB) is below the app's 3 MB photo limit, so larger photos are rejected with `CONTENT_TOO_LARGE`. Set `security.actionBodySizeLimit` or compress harder · `sonnet`
- [ ] **Airtable client robustness:** no fetch timeout, no retry of GETs on network errors or 5xx, a 30 s inline wait on 429 during a page render; network errors (fetch rejects) aren't reported to Sentry · `opus`
- [ ] **Image proxy bursts:** every `/img` cache miss calls Airtable; a cold list can exceed 5 requests/s and push page renders into the 30 s wait · `opus`
- [ ] **Images always full size:** list rows and the detail header never pass `?size`, so every 52 px thumbnail loads the original (`RecipeRow.astro`, `RecipeHeader.astro`) · `sonnet`
- [ ] **Timer alarm silent after leaving cooking mode:** each navigation is a full page load, so the audio unlock and the screen wake lock are lost; keep the screen on while a timer runs and hint when sound is locked, or keep the timers alive across navigations · `opus`
- [ ] **Chosen servings don't reach cooking mode:** cooking mode always shows the base amounts; pass the servings in the URL. The plan item „ingredients sheet (scaled)“ is ticked although it isn't · `sonnet`
- [ ] **Sentry Node SDK on cold start:** the static import in `lib/monitoring.ts` took 0.3–0.9 s locally, also without a DSN. Measure on Vercel; if confirmed, load it lazily or only with a DSN · `sonnet`
- [ ] **Replay loads at page start:** the 37 KB replay chunk competes with hydration; load it after `load` and idle (`sentry.client.config.ts`) · `haiku`
- [ ] **Missing tests:** actions (`src/actions/index.ts`), `_save-form.ts`, the login/edit/new pages, `PhotoStep`, the photo-upload hook, the timer store; no test for double submit · `sonnet`
- [ ] **E2E and CI:** tests depend on the current recipe data (helper loads every recipe page), the favorites test passes silently when the list is empty, CI retries hide flaky tests, e2e doesn't gate deploys, the e2e job likely fails on Dependabot PRs (no secrets); the edit test „Abbrechen goes back“ flaked once locally · `sonnet`
- [ ] **Timer pill text:** the space before „·“ is lost („Titel· Schritt 5“) because `.description` is a flex container (`Timers.module.css`) · `haiku`
- [ ] **Favoriten tab heart color:** filled in ink when active, design has accent (`TabBar.astro`); also remove the „Open: color of the filled heart“ note in the plan · `haiku`
- [ ] **Gap before „Bearbeiten“** is 16 px instead of 8 px: the toast's empty status element is a second flex item in the header (`FavoriteButton.tsx`, `Toast.tsx`) · `haiku`
- [ ] **Outdated docs:** ADR 0002 and spec 02 list repository functions and a delete flow that don't exist and say typecast creates new options (code forbids it); the „hint“ on the detail page for unreadable fields isn't built; spec 01 says „no third-party requests from the browser“ (not true with Sentry); „for two / both of us“ in README, 06-deployment and ADRs 0001, 0003, 0011; ADR 0008's CI description; ADR 0009 promises reports for failed image uploads, only the Airtable part is reported · `sonnet`
- [ ] **Duplicated definitions:** meal/category value lists and the URL rule exist 2–3 times (`record.ts`, `form.ts`, `input.ts`); the „not found“ block is copied into three pages; the ingredient list markup exists in `Ingredients.tsx` and `CookingMode.tsx` · `sonnet`
- [ ] **Casts that hide types:** `as RecordReading` (3×, `record.ts`), `step.timerMinutes!` (`CookingMode.tsx`), `favoritedAt!` (`favorites.ts`), `'full' as ImageSize` (image route) · `sonnet`
- [ ] **Repeated UI texts:** „N Rezept(e)“ plural in 4 texts files, meal short labels in 3, `✕` in 4, the login title in 2; servings formatted differently in the recipe row and on the recipe page · `haiku`
- [ ] **Stale comments and unused branches:** `input.ts` comment about the form action, unused modes in `Chip.astro` and the button branch in `SegmentedControl.astro`, ADR file name `0010-e2e-tests-deferred` vs its status · `haiku`
- [ ] **`path-to-regexp` advisory** via `@astrojs/vercel`: build time only, not reachable at runtime; recheck when `@astrojs/vercel` updates · `haiku`

### Nice to have

- [ ] **Security headers:** no CSP, `frame-ancestors`, `nosniff` or referrer policy; only Vercel's HSTS is sent · `opus`
- [ ] **Sessions:** a password change doesn't end existing sessions; use a `__Host-` cookie name once the custom domain exists (ADR 0011) · `sonnet`
- [ ] **Login guessing:** each attempt costs a scrypt hash on Hobby; accepted in ADR 0004, revisit if Sentry Logs show many „Login failed“ · `sonnet`
- [ ] **Production Airtable token scope:** `schema.bases:read` isn't used by the app, only by the schema script · `haiku`
- [ ] **No length limits on recipe text fields** in the form schema · `haiku`
- [ ] **Expired timers ring later:** timers that ran out while the app was closed ring the next time it opens, even days later · `sonnet`
- [ ] **Double tap on „Timer starten“** adds two timers · `haiku`
- [ ] **„Kochen“ leads nowhere** for recipes whose steps are only headings (redirects back to the recipe) · `haiku`
- [ ] **Source link hidden** when „Quelle“ is empty although a URL is set · `haiku`
- [ ] **Search ignores umlaut/ß variants** („ae“, „ss“) · `sonnet`
- [ ] **Cooking-mode swipe** also fires on mouse text selection · `haiku`
- [ ] **Error pages:** every Airtable outage shows the generic 500 page; a separate „Airtable is unavailable“ (503) page would help · `sonnet`
- [ ] **Repository API:** pages and actions build the Airtable connection in 9 places; one server-only module would be the natural home for a cache; `fields.ts` mixes Airtable field IDs with lists the browser uses · `opus`
- [ ] **Push timers („Later“):** need a scheduler Vercel Hobby doesn't offer; note it in ADR 0012 · `haiku`
- [ ] **Timers island on every page:** hydrates with `client:load` and imports `Maulti` and the sound code (13 KB gz on pages without other islands) · `sonnet`
- [ ] **Fonts:** both fonts are preloaded on every page (107 KB) · `sonnet`
- [ ] **Render-blocking CSS:** 1–2 external CSS files per page; small enough to inline · `sonnet`
- [ ] **Writes make 2–3 sequential Airtable calls** (lookup before PATCH) · `sonnet`
- [ ] **Image hints:** no `fetchpriority` on the header image, no `decoding="async"` · `haiku`
- [ ] **Image cache key:** unknown query values on `/img` bypass the CDN cache; ignore everything but `size` · `haiku`
- [ ] **Recipe list not paginated:** renders all recipes at once · `sonnet`
- [ ] **Design details:** alarm backdrop 40 % (design 50 %), ingredients sheet title 22 px (design 20 px), tab bar without its 6 px inner padding, source line 15 px/600 (design 13 px/700), meta stickers wrap earlier, the native „Quelle“ select looks different from the other inputs, no pressed states or tap-highlight handling, focus ring on the search and login fields on every tap · `sonnet`
- [ ] **„Neues Rezept“ prefills Portionen with 4;** the design has it empty (placeholder only) · `haiku`
- [ ] **Tokens:** no type scale (font sizes as `rem` literals in 28 files); repeated sizes (56, 58, 18 px), the focus ring (6 copies) and the timer pill radius (`--radius-card`) without tokens; disabled opacity 0.35 vs 0.4 · `sonnet`
- [ ] **Docs details:** ADR 0006 example (`client:visible` carousel) not built; 03-data-model units (`Pck.`), ranges, `SOURCES`, `interface` in the draft types; 06-deployment env table misses `VERCEL_ENV` and the `AIRTABLE_BASE_ID` CI secret; 04-auth misses the one-year server-side session check; the `Europe/Berlin` time zone isn't documented; 05-design-integration process list, docs/README row 0009, ADR 0010's first bullet, the README scripts table and ADR 0005 („JPEG/WebP“, replace/delete) are out of date · `haiku`
- [ ] **Owner's name in the public repo:** account slug in `06-deployment.md`, full name in `package.json`; no `LICENSE` file although `package.json` says MIT · `haiku`
- [ ] **Code style details:** duplicated small logic (`AMOUNT` regex, `wait()`, page heading CSS), routes hard-coded about 20 times, undocumented `data-*` test hooks in production markup, clever `{valid, value}` helpers in `form.ts`, untyped `let`s in `edit.astro`, abbreviated names (`a`/`b` in `favorites.ts`, `err` in `password.ts`) · `sonnet`
- [ ] **Tests:** filler tests that restate markup (Pill, Button, Icon) and a vacuous type-level test, brittle selectors (scoped class names), mocks that hide behavior, no DST cases, no test for logout/session expiry · `sonnet`
- [ ] **Dependencies:** GitHub Actions v7 → v8; no `dependabot.yml` (check whether Dependabot security updates are on in the repo settings); patch updates for eslint, vitest, typescript-eslint, globals, preact-render-to-string, `@types/node` · `haiku`
