# 03 – Data model

> **TODO (Airtable):** inspect the existing base (needs `AIRTABLE_TOKEN` + `AIRTABLE_BASE_ID`) and fill in the mapping below.
> **TODO (design):** the ingredient structure is defined by the design.

## Domain types (draft)

Pages and components only use these types. The Airtable shape stays inside `lib/recipes`.

```ts
type RecipeId = string; // Airtable record id

interface Recipe {
  id: RecipeId;
  title: string;
  description?: string;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  tags: string[];
  ingredients: Ingredient[]; // shape depends on the design, see below
  steps: string[]; // or rich text; decided by the design
  images: RecipeImage[];
  source?: string; // URL or book reference
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Option A – free text: one line per ingredient ("200 g Mehl")
type IngredientText = { text: string };

// Option B – structured: needed for the serving scaler and the shopping list
type IngredientStructured = {
  amount?: number;
  unit?: string; // g, ml, EL, TL, Stück, Prise …
  name: string;
  note?: string; // "fein gehackt"
  group?: string; // "Für den Teig"
};

type Ingredient = IngredientText | IngredientStructured; // pick one after the design

interface RecipeImage {
  id: string;
  url: string; // app-internal URL, see ADR 0005; never the raw Airtable URL
  width?: number;
  height?: number;
  alt?: string;
}
```

## Airtable mapping

Filled in with the output of `npm run airtable:schema`. The code uses the **field ID** (ADR 0002); the name is for humans.

| Domain field | Airtable field name | Field ID | Type | Notes |
| ------------ | ------------------- | -------- | ---- | ----- |
| _TODO_       |                     |          |      |       |

## Data conventions (contract for all writers)

The app, manual edits in Airtable and Claude sessions all write to the same base. To keep the data readable by the app, every writer follows these rules:

> **TODO:** fill in after inspecting the base and the design, for example: ingredient format, units (g, ml, EL, TL, Stück, Prise), step format, tag spelling, required fields.

- Title is required; everything else is optional
- Use existing tags and categories where possible; new ones are allowed (the app creates them via `typecast`)
- Never write computed fields

Questions to answer while inspecting the base:

- Which tables exist (one recipe table, or separate ingredient/tag tables)?
- How are ingredients stored today? If the design needs structured ingredients and they're stored as free text, plan a one-time migration.
- Which fields are linked records, multi-select or attachments?
- Are there fields the app must never overwrite (formulas, lookups)?

## Validation

Every record read from Airtable passes a zod schema. Invalid records are logged and skipped in lists, so one broken record doesn't break the page.
