# 01 – Requirements

v1 scope decided from the design handoff (2026-09-26). Screen details: `design/README.md` and `design/screenshots/`.

## Functional – v1

**Access**

- Log in with the shared password and stay logged in on the device for about a year ([04-auth](04-auth.md)). Login screen as designed (`design/README.md`, „0. Login“; `design/screenshots/00-login.png`).

**Start**

- Greeting by Maulti depending on the time of day
- Meal choice (Frühstück / Abend / Backen) and time choice (Wenig Zeit ≤ 30 min, Backen ≤ 90 min / Viel Zeit), with defaults by time of day and weekday
- Suggestion carousel: up to 6 matching recipes, shuffled per day, "Nochmal würfeln"
- Favorites preview and "Stöbern" by category

**Recipes**

- One list with search (name **and** ingredients) and grouping by category
- Meal filter and a filter sheet: category, "Bis 30 Min.", "Mit Anleitung"
- Favorites tab (favorites are **shared by everyone**, stored in Airtable)

**Recipe detail**

- Header with category color, optional photo, source link, time and calorie stickers
- Serving scaler: amounts in the ingredient text are recalculated (rules in [03-data-model](03-data-model.md))
- Steps with sections, hints and timer chips; notes expandable
- Recipes without instructions are shown as ideas with "Rezept ergänzen"

**Cooking mode**

- One step at a time, swipe or buttons, progress dots, ingredients sheet
- Screen stays on (Screen Wake Lock API)
- Timers: several in parallel, found in the step text. When a timer ends: overlay, sound and vibration **while the app is open** ([ADR 0012](../decisions/0012-pwa-and-timers.md))
- Photo step at the end if the recipe has no photo: take a photo, resize in the browser, upload to Airtable ([ADR 0005](../decisions/0005-image-handling.md))

**Edit / new**

- One form for both: name, category, meals, servings, times, ingredients, instructions, source, link, notes. Changes are written to Airtable
- Deleting a recipe is **not** in the app (the design has no delete); delete in Airtable directly

**App**

- Installable on the home screen (web app manifest and icons, [ADR 0012](../decisions/0012-pwa-and-timers.md))
- Light and dark mode following the system setting
- Plain error pages for "not found" and "something went wrong" (no design needed for v1)

## Later (not v1)

- Timer notifications when the phone is locked or the app is closed (Web Push, [ADR 0012](../decisions/0012-pwa-and-timers.md))
- Shopping list collected from several recipes (not in the design)
- Deleting recipes in the app
- Logout button (not needed in v1: sessions last about a year; to log everyone out, rotate `SESSION_SECRET`)
- Offline use
- Maulti in dark mode: his dark brown outline and arms are hard to see on the dark background (same in the design). Ask Claude Design for a lighter outline in dark mode

## Non-functional

- **Mobile-first**, focus iPhone, usable with one hand in the kitchen; desktop works too
- **Fast enough on mobile:** a page shows within about 1 s on 4G. Airtable latency is the main factor
- **Free tier only:** Vercel Hobby and Airtable's free plan
- **Security:** everything behind login; no secrets in the repo (see [04-auth](04-auth.md), [06-deployment](06-deployment.md))
- **Accessibility:** semantic HTML, sufficient contrast, usable by keyboard, touch targets ≥ 44 px, font sizes in `rem` so they follow the system text size (design README, "Barrierefreiheit")
- **Privacy:** no third-party requests from the browser; fonts are self-hosted ([ADR 0007](../decisions/0007-styling-approach.md))

## Settled product decisions

- **Users:** family and friends, one shared password ([00-vision](00-vision.md), [ADR 0004](../decisions/0004-shared-password-auth.md))
- **UI language: German only.** No i18n framework; German strings live directly in the components. Code, identifiers and docs are in English
- **Ingredients and steps stay free text** in Airtable and are parsed by the app ([03-data-model](03-data-model.md))
- **Concurrent edits:** not a concern. Last write wins, no locking or conflict detection
