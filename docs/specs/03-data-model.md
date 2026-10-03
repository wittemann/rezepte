# 03 – Data model

Source: the Airtable base **Kochbuch** (`applSRjoVJrqAFQhT`), table **Rezepte**, inspected 2026-09-26 (95 recipes). Ingredient and step format come from the design handoff (`design/README.md`, "Regeln & Logik").

## Domain types (draft)

Pages and components only use these types. The Airtable shape stays inside `lib/recipes`.

Ingredients and steps stay **free text** in Airtable (one line per ingredient, numbered steps). The app parses them for display, the serving scaler and cooking mode. The raw text is kept for the edit form, so editing never loses what the parser doesn't understand.

```ts
type RecipeId = string; // Airtable record id

type Meal = 'Frühstück' | 'Mittag & Abend' | 'Backen';

interface Recipe {
  id: RecipeId;
  title: string;
  category?: string; // one of CATEGORIES normally; unknown values are shown with a neutral color
  meals: Meal[];
  servings?: number; // base for the serving scaler; missing → no scaler
  workMinutes?: number; // "Arbeitszeit"
  totalMinutes?: number; // "Gesamtzeit"
  caloriesPerServing?: number; // read-only (Airtable formula)
  ingredientsText: string; // raw, for editing
  stepsText: string; // raw, for editing
  ingredients: IngredientLine[]; // parsed from ingredientsText
  method: Method; // parsed from stepsText
  hasInstructions: boolean; // false → "stub" (an idea without instructions)
  images: RecipeImage[];
  source?: string; // "Chefkoch", "YouTube", …
  sourceUrl?: string;
  notes?: string;
  favoritedAt?: string; // ISO timestamp; set → favorite (shared by everyone), newest first
  createdAt: string;
}

type IngredientLine =
  | { kind: 'heading'; text: string } // "Für den Teig:"
  | { kind: 'item'; text: string; quantity?: Quantity }; // "250 g Mehl"

interface Quantity {
  min: number; // "2–3" → min 2, max 3
  max?: number;
  unit?: string; // g, kg, ml, l, EL, TL, Pck., Prise, …
  prefix?: 'ca.' | 'knapp' | 'etwa'; // kept as written, shown in front of the scaled amount
  rest: string; // the text after amount and unit: "Mehl (Type 550)"
}

interface Method {
  sections: { title?: string; steps: Step[] }[]; // title from lines like "Teig:"
  hint?: string; // paragraphs after the last numbered step
}

interface Step {
  text: string;
}

interface RecipeImage {
  id: string; // Airtable attachment id
  url: string; // app-internal URL, see ADR 0005; never the raw Airtable URL
  width?: number;
  height?: number;
}
```

Constants (from the design): `CATEGORIES` = Hauptgericht, Beilage, Salat, Suppe, Grillen, Dessert, Backen, Grundrezept; `MEALS` as in the type above.

Favorites are **shared by everyone** (one shared password, no personal accounts): the field `Favorit seit` holds the time the recipe was marked. Empty → not a favorite. Deviates from the design README, which says per device ([05-design-integration](05-design-integration.md)).

## Airtable mapping

Table `Rezepte` = `tblsuZ3AUOqkpY1vk`. The code uses the **field ID** (ADR 0002); the name is for humans. Durations come from the API in **seconds**.

| Domain field                      | Airtable field       | Field ID            | Type                     | App writes?                |
| --------------------------------- | -------------------- | ------------------- | ------------------------ | -------------------------- |
| `title`                           | Name                 | `fldCRBNH34d7JR7OC` | singleLineText (primary) | yes, required              |
| `category`                        | Kategorie            | `fldqzw4p8KhQ5s4l8` | singleSelect             | yes                        |
| `meals`                           | Mahlzeit             | `fldj4rzvZS4HBehTQ` | multipleSelects          | yes                        |
| `servings`                        | Portionen            | `fldahLlPF8xIsZD0Q` | number                   | yes                        |
| `workMinutes`                     | Arbeitszeit          | `fldjztn4ZPOpPCz90` | duration (`h:mm`)        | yes                        |
| `totalMinutes`                    | Gesamtzeit           | `fldf7iHYnrUpyX5SB` | duration (`h:mm`)        | yes                        |
| `ingredientsText` → `ingredients` | Zutaten              | `fldG4ZG49PFX7YMb9` | multilineText            | yes                        |
| `stepsText` → `method`            | Zubereitung          | `fldOK5mDwNTRgjzmQ` | multilineText            | yes                        |
| –                                 | Kalorien gesamt      | `fldBz3DRCMbeL1qvF` | number (whole recipe)    | no (not in the edit form)  |
| `caloriesPerServing`              | Kalorien pro Portion | `fldbfkuTs6teEZiz3` | **formula**              | **never**                  |
| `images`                          | Foto                 | `fldshOL4NdmkjPqXe` | multipleAttachments      | via upload only (ADR 0005) |
| `source`                          | Quelle               | `fldFlH3z4ScSU3oJz` | singleSelect             | yes                        |
| `sourceUrl`                       | Original-Link        | `fldqeCigWMnW400lN` | url                      | yes                        |
| –                                 | Meine Bewertung      | `fldNQWaV85W4mRwgu` | rating                   | no (not used by the app)   |
| `notes`                           | Notizen              | `fldavsvzGmItYK5Va` | multilineText            | yes                        |
| `favoritedAt`                     | Favorit seit         | `fldYS250RG0Aa3mzC` | dateTime (with time)     | yes, only via the heart    |

`Mahlzeit` and the category `Grillen` were added on 2026-09-26 for the design, filled with the suggestions from `design/Mahlzeit-Zuordnung.csv` (6 recipes moved to `Grillen`; 15 recipes have no meal).

## Data conventions (contract for all writers)

The app, manual edits in Airtable and Claude sessions all write to the same base. To keep the data readable by the app, every writer follows these rules:

The app keeps a copy of the recipe table in memory ([ADR 0003](../decisions/0003-rendering-and-caching.md)): records written directly to Airtable show up in the app after at most 15 minutes.

**Fields**

- **Name** is required; everything else is optional
- **Kategorie:** exactly one of Hauptgericht, Beilage, Salat, Suppe, Grillen, Dessert, Backen, Grundrezept. New categories are possible, but the design has colors and icons only for these
- **Mahlzeit:** any of `Frühstück`, `Mittag & Abend`, `Backen`. Empty = the recipe doesn't appear in the start page suggestions
- **Portionen:** a whole number: the number the ingredient amounts are written for. Leave empty if that makes no sense (e.g. a marinade); the app then hides the serving scaler
- **Arbeitszeit / Gesamtzeit:** Airtable duration `h:mm`
- **Quelle:** one of `Chefkoch`, `YouTube`, `Instagram`, `Webseite` (any other website), `Apple Notes`. The app offers only these
- **Never write** `Kalorien pro Portion` (formula). Don't write fields the app doesn't know; use `PATCH`, never `PUT`

**Zutaten** (one ingredient per line)

- Amount first, then unit, then the rest: `250 g Mehl`, `1,5 EL Zucker`, `0,5 TL Salz`, `2–3 Zehen Knoblauch`, `ca. 200 g Kartoffeln`
- Amounts: whole numbers or decimal comma (`1,5`, `0,5`); no fractions (`½`, `1/2`): such lines are shown as written and not scaled. Ranges with an en dash `2–3`, optional prefix `ca.`, `knapp`, `etwa`
- Amount and unit are separated by a space (`250 g`, not `250g`)
- Units shown with the amount: `g kg ml l EL TL Päckchen Prise(n) Tasse Becher Dose Bund Beutel Topf Schuss Spritzer Klecks Handvoll Zweige Stangen`. Other words after the amount are fine; the amount still scales
- Lines without an amount (`Salz, Pfeffer`) are fine; they're never scaled
- A line ending in `:` is a sub-heading: `Für den Teig:`
- Equipment (form, pan, machine) goes at the end under `Außerdem:`, not into Zubereitung

**Zubereitung**

- Starts with step `1.` (or a section heading); no text before the first step
- Steps numbered `1.`, `2.`, … one step per paragraph
- A line ending in `:` starts a section: `Teig:`. Numbering may restart per section
- Paragraphs after the last numbered step are shown as a hint
- Empty = the recipe is an idea ("Noch ohne Anleitung") and invites completing it

## Validation

Every record read from Airtable passes a zod schema. Invalid records are logged and skipped in lists, so one broken record doesn't break the page. The text parsers never fail: a line they don't understand is shown as plain text and simply isn't scaled.
