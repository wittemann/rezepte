// Where recipes live in Airtable, and the fixed category and meal values (docs/specs/03-data-model.md).
// The code uses field IDs, so renaming a field in Airtable doesn't break the app.
// Check against the base with `npm run airtable:schema`.

export const RECIPES_TABLE_ID = 'tblsuZ3AUOqkpY1vk'; // Rezepte

/** Field IDs of the recipe table, named after the domain fields they hold. */
export const RECIPE_FIELDS = {
  title: 'fldCRBNH34d7JR7OC', // Name (primary field)
  category: 'fldqzw4p8KhQ5s4l8', // Kategorie
  meals: 'fldj4rzvZS4HBehTQ', // Mahlzeit
  servings: 'fldahLlPF8xIsZD0Q', // Portionen
  workTime: 'fldjztn4ZPOpPCz90', // Arbeitszeit, duration in seconds
  totalTime: 'fldf7iHYnrUpyX5SB', // Gesamtzeit, duration in seconds
  ingredients: 'fldG4ZG49PFX7YMb9', // Zutaten
  steps: 'fldOK5mDwNTRgjzmQ', // Zubereitung
  caloriesPerServing: 'fldbfkuTs6teEZiz3', // Kalorien pro Portion: formula, never write
  images: 'fldshOL4NdmkjPqXe', // Foto: attachments, written only via upload
  source: 'fldFlH3z4ScSU3oJz', // Quelle
  sourceUrl: 'fldqeCigWMnW400lN', // Original-Link
  notes: 'fldavsvzGmItYK5Va', // Notizen
} as const;

/**
 * The categories in display order: the Airtable value and the English name
 * used by the `--pastel-cat-*` tokens and the category icons.
 */
export const CATEGORIES = [
  { value: 'Hauptgericht', name: 'main' },
  { value: 'Beilage', name: 'side' },
  { value: 'Salat', name: 'salad' },
  { value: 'Suppe', name: 'soup' },
  { value: 'Grillen', name: 'grill' },
  { value: 'Dessert', name: 'dessert' },
  { value: 'Backen', name: 'baking' },
  { value: 'Grundrezept', name: 'basics' },
] as const;

/** Name for the `--pastel-cat-*` tokens and category icons; unknown or missing category → "other" (neutral color, no icon). */
export function categoryName(
  category: string | undefined,
): (typeof CATEGORIES)[number]['name'] | 'other' {
  return CATEGORIES.find((entry) => entry.value === category)?.name ?? 'other';
}

/** The meals in display order: the Airtable value and the `--pastel-meal-*` name. */
export const MEALS = [
  { value: 'Frühstück', name: 'breakfast' },
  { value: 'Mittag & Abend', name: 'lunch-dinner' },
  { value: 'Backen', name: 'baking' },
] as const;

/**
 * The sources ("Quelle") a recipe can come from; "Webseite" covers any other website.
 * A fixed list, because writes use typecast and would turn a typo into a new select option.
 */
export const SOURCES = ['Chefkoch', 'YouTube', 'Instagram', 'Webseite', 'Apple Notes'] as const;

export type Category = (typeof CATEGORIES)[number]['value'];
export type Meal = (typeof MEALS)[number]['value'];
export type Source = (typeof SOURCES)[number];
