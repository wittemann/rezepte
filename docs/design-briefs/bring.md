# Design brief: send ingredients to Bring!

For Claude Design, as an addition to the existing handoff („Kochbuch-App Maulti“, variant `playful` only, incl. section „8. Bewertung“). UI texts are German; the rest of this brief is English.

## Context

- Family cookbook, one shared password, no user accounts. The family keeps its shopping list in the Bring! app.
- New: from a recipe, put its ingredients on the family's Bring! list. Not every ingredient belongs there (salt, oil, spices are usually at home), so the user picks before sending. Background: [ADR 0014](../decisions/0014-bring-shopping-list.md).
- Everyone writes to the same list. Nothing is remembered between recipes.
- The recipe page today, top to bottom: header card (back, heart, calendar button, „Bearbeiten“, star rating, optional photo, category pill, title, „von {Quelle}“, Maulti), meta stickers, ingredients with the servings stepper („Weniger Portionen“ / „Mehr Portionen“), steps, notes, „Jetzt kochen“ button. Recipes without instructions („Stubs“) still have ingredients; some recipes have none.

## What to design

### 1. Entry point on the recipe page

- A button that opens the Bring sheet. Suggestion: in or next to the „Zutaten“ section, because the amounts there follow the servings stepper and that is what gets sent. Other places are fine if they fit better (the header card is already full).
- Recipes without ingredients: no button.
- The Bring! name and logo: use the name in the text („Zu Bring! hinzufügen“). A logo only if it fits the sticker style; Bring's own green is not part of our tokens.

### 2. Sheet „Auf die Einkaufsliste“ (title is a suggestion)

- Based on the existing bottom sheet (like „Wann gibt's das?“ and the filter sheet).
- One row per ingredient line, as shown in the „Zutaten“ section (amounts scaled to the current servings), each with a checkbox. All checked when the sheet opens.
- Headings like „Für den Teig“ are group titles, without a checkbox.
- Quick helpers if useful, e.g. „Alle“ / „Keine“.
- Main button „Zu Bring! hinzufügen“, ideally with the count („5 Zutaten zu Bring! hinzufügen“). Disabled when nothing is checked.
- Long lists (20+ lines) must scroll inside the sheet, with the button always reachable.

### 3. Sending, success, error

- Sending takes about a second: show a busy state on the button, the sheet can't be sent twice.
- Success: decide between closing the sheet with a toast (e.g. „5 Zutaten sind auf der Einkaufsliste“) or a success state in the sheet (Maulti pose?). Please give the texts.
- Error (offline, Bring not reachable): the sheet stays open with the picks unchanged, an error message in the sheet and the button to try again. Please give the text.

## States and rules

- Light and dark mode (dark follows the system).
- Touch targets at least 44 px, the whole row toggles its checkbox. Sizes in rem, layouts must hold with large system text.
- Screen readers: the checkboxes are labelled with the ingredient line; the button announces the count. Please add the German labels.
- Maulti: an existing pose if one fits; a new one needs the SVG like the others.

## Deliverables

- Updated prototype (`Kochbuch App.dc.html`, branch `isPlay`), new section in `README.md` with sizes, texts and behavior as for the other screens.
- Screenshots (390 × 844): recipe page with the entry point, sheet (all checked, some unchecked, with headings, long list scrolled), sending, success, error; dark mode for at least the sheet.
- No recipe data in the handoff files that go into the repo (the repo is public). Use made-up example ingredients.
