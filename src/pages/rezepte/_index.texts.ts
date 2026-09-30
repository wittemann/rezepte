// UI texts of the recipe list page and the content of its filter sheet (design/README.md, "Rezepte").
// The filter button and the "N Rezepte anzeigen" text are in components/FilterSheet.texts.ts.
import { MEALS } from '../../lib/recipes/fields.ts';

const count = (recipeCount: number) => `${recipeCount} ${recipeCount === 1 ? 'Rezept' : 'Rezepte'}`;

export const TEXT = {
  title: 'Rezepte',
  count,
  found: (recipeCount: number) => `${count(recipeCount)} gefunden`,
  meals: 'Mahlzeit',
  allMeals: 'Alle',
  // Short labels for the segmented control (the Airtable values are longer)
  mealLabels: {
    'lunch-dinner': 'Abend',
    breakfast: 'Frühstück',
    baking: 'Backen',
  } satisfies Record<(typeof MEALS)[number]['name'], string>,
  // Filter sheet
  reset: 'Zurücksetzen',
  category: 'Kategorie',
  other: 'Sonstiges',
  quick: 'Bis 30 Min.',
  withInstructions: 'Mit Anleitung',
};
