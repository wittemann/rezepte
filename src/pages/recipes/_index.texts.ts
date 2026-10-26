// UI texts of the recipe list page and the content of its filter sheet (design/README.md, "Rezepte").
// The filter button and the "N Rezepte anzeigen" text are in components/FilterSheet.texts.ts.
import { MEALS } from '../../lib/recipes/fields.ts';

const count = (recipeCount: number) => `${recipeCount} ${recipeCount === 1 ? 'Rezept' : 'Rezepte'}`;

export const TEXT = {
  title: 'Rezepte',
  count,
  found: (recipeCount: number) => `${count(recipeCount)} gefunden`,
  /** After the count when sorted „Beste zuerst“: "95 Rezepte · beste zuerst" */
  bestFirst: ' · beste zuerst',
  meals: 'Mahlzeit',
  allMeals: 'Alle',
  // Below the list: loads recipes changed directly in Airtable (docs/decisions/0003-rendering-and-caching.md)
  refresh: 'Aktualisieren',
  // Short labels for the segmented control (the Airtable values are longer)
  mealLabels: {
    'lunch-dinner': 'Abend',
    breakfast: 'Frühstück',
    baking: 'Backen',
  } satisfies Record<(typeof MEALS)[number]['name'], string>,
  // Filter sheet
  reset: 'Zurücksetzen',
  sort: 'Sortieren',
  sortByTitle: 'A–Z',
  sortBestFirst: 'Beste zuerst',
  category: 'Kategorie',
  rating: 'Bewertung',
  unrated: 'Unbewertet',
  /** Screen reader name of a rating chip, which shows only stars */
  stars: (count: number) => (count === 1 ? '1 Stern' : `${count} Sterne`),
  other: 'Sonstiges',
  quick: 'Bis 30 Min.',
  withInstructions: 'Mit Anleitung',
};
