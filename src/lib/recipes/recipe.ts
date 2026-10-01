// The recipe as pages and components see it (docs/specs/03-data-model.md, "Domain types").
// The Airtable shape stays inside lib/recipes (record.ts).

import type { Meal } from './fields.ts';
import type { IngredientLine } from './ingredients.ts';
import type { Method } from './method.ts';

/** Airtable record ID, e.g. "recAbc123…". */
export type RecipeId = string;

export type Recipe = {
  id: RecipeId;
  title: string;
  category?: string; // one of CATEGORIES normally; unknown values are shown with a neutral color
  meals: Meal[]; // unknown values are left out
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
  sourceUrl?: string; // http(s) only
  notes?: string;
  createdAt: string; // ISO timestamp, when the Airtable record was created
};

export type RecipeImage = {
  id: string; // Airtable attachment ID
  url: string; // app-internal image route (ADR 0005), never the raw Airtable URL
  width?: number;
  height?: number;
};
