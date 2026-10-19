# Bugs

Known bugs, found while using the app. Fixed like every other change: small commit, manual review ([implementation-plan](implementation-plan.md), "How we work"). A fixed bug is ticked off in the commit that fixes it; a bug with a visible effect gets a test that would have caught it, where feasible. `sonnet` etc. = the model to use, as in the plan. Each list is in suggested fixing order (impact vs. effort, related items next to each other); fixed bugs move to the end of their list.

- [x] Back button on the recipe page always goes to `/rezepte`, also when coming from the start page (or favorites). Go back to where the user came from, with `/rezepte` as the fallback for a direct visit · `sonnet`
- [x] Home-screen app on iPhone: the page headline sits under the iOS status bar blur (seen on Rezepte list); fix top clearance, check on device · `sonnet`
- [x] Double-tap zoom on the servings stepper: tapping − or + quickly zooms the page on iOS. Add `touch-action: manipulation` to the stepper buttons (or globally to buttons and links); check other quickly tapped controls · `haiku`
- [x] Recipe page scrolls sideways: the page must never be wider than the screen. Not reproducible in the browser at 375 px with normal text; with a very large system text size the servings stepper pushes past the right edge. Find the cause on a real iPhone, then check all screens with large text · `sonnet`
- [x] Timer pill covers the cooking-mode header: while a timer runs, the pill (fixed at the top) sits over the „Zutaten“ button (can't be tapped) and the step indicator. Reserve header space while timers run or move the pill below the header · `sonnet`
- [x] Soft blur at the top of every page in the home-screen app (seen in cooking mode with a timer pill). Unclear if it's the pill's `--shadow-float` or the iOS 26 status-bar effect; check on a page without a timer first, then try `apple-mobile-web-app-status-bar-style` (verify against current docs) · `sonnet`
- [x] Swipe between steps doesn't work on the phone in cooking mode (the buttons do). Reproduce on a real iPhone (home-screen app and Safari), find why the touch handlers don't fire (e.g. `touch-action`, scrolling, or the pointer events used), then fix and add a test where feasible · `opus`
- [x] Cooking mode is taller than the screen when there's a top inset (home-screen app on iPhone): `CookingMode.module.css` sets `min-height: 100dvh` and `body` adds the `--safe-top` padding on top, so the page scrolls and the bottom buttons can be cut off. Subtract the inset (as `ErrorMessage.astro` does); check `LoginForm.module.css` too, which has the same pattern · `sonnet`
- [x] Screen goes to sleep in cooking mode on the iPhone (also in Safari, latest iOS). Safari only grants a wake lock right after a tap (user activation); `use-wake-lock.ts` requested it on page load, and the refusal was swallowed. Request it again on the next tap while it isn't held, and open cooking mode on the recipe page (`CookingLauncher`), so the tap on „Los, wir kochen!“ still counts · `opus`
- [x] Some code is in German, against the rule "code, identifiers and docs in English" (CLAUDE.md). Check all code (identifiers, file names, comments, test names, CSS classes) and move it to English; UI texts in `*.texts.ts` stay German. Decide separately about the German routes (`/rezepte`, `/favoriten`, `/neu`): they are user-visible URLs, so changing them breaks saved links and home-screen bookmarks · `sonnet`
- [x] Filter sheet on iPhone (seen in dark mode): „Zurücksetzen“ shows the accent focus ring right after the sheet opens. Likely `showModal()` focusing the first focusable element, which Safari then treats as `:focus-visible`. Reproduce on the iPhone, then e.g. give the dialog (or its title) `autofocus`/`tabindex=-1` so no button gets the ring on open; check the ingredients sheet in cooking mode too · `sonnet`

## From the project-wide reviews (2026-10-02)

Findings of the section 9 reviews in [implementation-plan](implementation-plan.md), merged and deduplicated. Severity as in the reviews: **blocker** = fix before launch, **should fix**, **nice to have**. Security findings are added here only with their fix (the repo is public).

The open findings were dropped on 2026-10-19: none had an effect seen in use, and a check of the base showed no record the edit form would lose data on. They are in the git history of this file; reopen one when it shows up in use.

### Blocker

- [x] **Airtable monthly API cap:** the free plan allows 1,000 API calls per workspace per month; without a cache (ADR 0003) every page view costs at least 1 call, every write 2, plus image cache misses and CI e2e runs, so the budget lasts days. Check the workspace plan first; on Free, add a short server cache of the recipe table cleared on every write (update ADR 0003) or move to a paid plan. Either way, tell a quota 429 from a rate-limit 429 and fail fast instead of waiting 30 s · `opus`

### Should fix

- [x] **Favoriten tab heart color:** filled in ink when active, design has accent (`TabBar.astro`); also remove the „Open: color of the filled heart“ note in the plan · `haiku`
- [x] **Gap before „Bearbeiten“** is 16 px instead of 8 px: the toast's empty status element is a second flex item in the header (`FavoriteButton.tsx`, `Toast.tsx`) · `haiku`
- [x] **Chosen servings don't reach cooking mode:** cooking mode always shows the base amounts; pass the servings in the URL. The plan item „ingredients sheet (scaled)“ is ticked although it isn't · `sonnet`
- [x] **Mixed numbers scale wrongly** (`ingredients.ts`): „1 1/2 TL“ and „1 ½ EL“ scale only the 1 (doubled: „2 ½“), against the data convention; `scaleAmount(0, 2)` returns 0.1. Fix with tests · `sonnet`
- [x] **Double tap on „Sichern“ creates two recipes:** no submit-in-progress guard in the new/edit form · `sonnet`
- [x] **Images always full size:** list rows and the detail header never pass `?size`, so every 52 px thumbnail loads the original (`RecipeRow.astro`, `RecipeHeader.astro`) · `sonnet`
- [x] **Replay loads at page start:** the 37 KB replay chunk competes with hydration; load it after `load` and idle (`sentry.client.config.ts`) · `haiku`

### Nice to have

- [x] **Server region:** functions run in Washington (`iad1`, Vercel default), so every request from Germany crosses the Atlantic. Hobby allows one region, e.g. `fra1` (`"regions"` in `vercel.json` or project settings). Airtable is in the US, so table loads, writes and image proxy misses get slower there; do it together with a shared recipe-table cache on Vercel (ADR 0003), then measure · `sonnet`
- [x] **Image hints:** no `fetchpriority` on the header image, no `decoding="async"` · `haiku`
