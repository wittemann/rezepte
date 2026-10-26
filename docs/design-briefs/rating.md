# Design brief: recipe rating

For Claude Design, as an addition to the existing handoff („Kochbuch-App Maulti“, variant `playful` only). UI texts are German; the rest of this brief is English.

## Context

- Family cookbook, one shared password, no user accounts. Everything is shared: favorites are one heart per recipe for everyone, not per device.
- New: **one shared rating per recipe, 1–5 stars**. Not per person, no average, no comments. Whoever rates last wins, like the heart. Empty = not rated yet (all recipes start empty).
- Since the handoff, the app has changed in two places the design doesn't show yet: the recipe header card has an extra round button for the calendar (opens a sheet „Wann gibt’s das?“ with Montag–Sonntag), and there are no timers in cooking mode anymore.

## What to design

### 1. Cooking mode: „Wie war's?“

- After the last step, a step that asks for the rating: Maulti, a short question (suggestion: „Wie war's?“), 5 large stars.
- Tapping a star saves it right away (no extra button). If the recipe already has a rating, it is preselected and can be changed.
- It can be skipped. Show how „Überspringen“ / „Fertig“ work here.
- Recipes without a photo already end with the photo step (Maulti `cheer`, „Juhu, geschafft! Machst du ein Foto für mich?“). Decide the order or whether both fit on one screen; it must not feel like two chores in a row.
- Maulti pose: an existing one (`cheer`?) or a new one (e.g. tasting from the spoon). A new pose needs the SVG like the others.

### 2. Recipe detail: header card

- Show the rating in the header card (category pastel background), and let people set or change it by tapping the stars.
- Unrated state: inviting, not empty-looking (e.g. 5 outline stars plus a hint).
- Define how to remove a rating (e.g. tap the selected star again), or say that it can't be removed.
- Must fit next to what is already there: back, heart, calendar, „Bearbeiten“, optional photo, category pill, title, „von {Quelle}“, overlapping Maulti.

### 3. Recipe row (lists: Rezepte, Favoriten, start page favorites)

- A compact display of the rating, e.g. in the meta line („1 Std. 5 Min. · 4 Portionen“) or next to the heart. Read-only.
- Unrated recipes show nothing extra.

### 4. Filter sheet

- A rating filter, e.g. a chip „Ab 4 Sternen“ next to „Bis 30 Min.“ and „Mit Anleitung“. It counts towards „Filter [n]“ and is reset by „Zurücksetzen“.
- Sorting: a way to see the best-rated first, e.g. „Sortieren: A–Z · Beste zuerst“. Today the list is grouped by category without a search and a flat hit list with a search; show how the sorting works with both.

## States and rules

- Light and dark mode (dark follows the system), category pastels in both.
- Star color: from the existing tokens if possible; if a new token is needed (e.g. a yellow), define it for light and dark, with enough contrast on pastel and on `surface`.
- Touch targets at least 44 px, also for the stars in the header card. Sizes in rem, layouts must hold with large system text.
- Screen readers: the stars work as one choice („3 von 5 Sternen“). Please add the German labels.
- Saving fails (offline, server error): the stars go back to the previous value and a toast appears (like the heart). Please give the toast text. Success: is there feedback beyond the filled stars (small animation, toast „Gespeichert“)?

## Deliverables

- Updated prototype (`Kochbuch App.dc.html`, branch `isPlay`), new section in `README.md` with sizes, texts and behavior as for the other screens.
- Screenshots (390 × 844): cooking mode „Wie war's?“ (with and without the photo step), detail header rated and unrated, recipe list with ratings, filter sheet with rating filter and sorting; dark mode for at least the detail header and the cooking step.
- No recipe data in the handoff files that go into the repo (the repo is public).
