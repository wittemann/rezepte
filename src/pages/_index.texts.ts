// UI texts of the start page (design/README.md, "Start")
import type { Greeting } from '../lib/start/start-query.ts';

export const TEXT = {
  title: 'Start',
  greeting: {
    morning: 'Guten Morgen! Ich bin Maulti.',
    day: 'Guten Tag! Ich bin Maulti.',
    evening: 'Guten Abend! Ich bin Maulti.',
  } satisfies Record<Greeting, string>,
  // Headline per meal, by the `--pastel-meal-*` name
  headline: {
    breakfast: 'Was frühstücken wir heute?',
    'lunch-dinner': 'Was kochen wir heute?',
    baking: 'Was backen wir heute?',
  },
  meals: 'Mahlzeit',
  mealLabels: {
    breakfast: 'Frühstück',
    'lunch-dinner': 'Abend',
    baking: 'Backen',
  },
  time: 'Wie viel Zeit?',
  littleTime: 'Wenig Zeit',
  littleTimeHint: (baking: boolean) => (baking ? 'bis 90 Min.' : 'bis 30 Min.'),
  muchTime: 'Viel Zeit',
  muchTimeHint: 'auch Aufwendiges',
  matching: (recipeCount: number) =>
    `${recipeCount} ${recipeCount === 1 ? 'passendes Rezept' : 'passende Rezepte'}`,
};
