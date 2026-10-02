// The edit form ("Bearbeiten" / "Neues Rezept", design/README.md, "7."): its values as the
// browser sends them (all text), and the way between those values and a RecipeInput.
// Reading checks each field on its own, so the form can mark exactly the fields that are wrong.

import { z } from 'zod';
import { CATEGORIES, MEALS, SOURCES, type Category, type Meal, type Source } from './fields.ts';
import type { RecipeInput } from './input.ts';
import type { Recipe } from './recipe.ts';
import { formatDurationInput, parseDurationInput } from './time.ts';

/** The form's fields, as plain text (meals: the checked boxes). Also the save Action's input. */
export const recipeFormSchema = z.object({
  title: z.string(),
  category: z.string(),
  meals: z.array(z.string()),
  servings: z.string(),
  workTime: z.string(), // h:mm
  totalTime: z.string(), // h:mm
  ingredients: z.string(),
  steps: z.string(),
  source: z.string(),
  sourceUrl: z.string(),
  notes: z.string(),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
export type RecipeFormField = keyof RecipeFormValues;

const CATEGORY_VALUES: readonly string[] = CATEGORIES.map((category) => category.value);
const MEAL_VALUES: readonly string[] = MEALS.map((meal) => meal.value);
const WHOLE_NUMBER = /^\d+$/;

/** An empty form for a new recipe, with the prototype's defaults (Hauptgericht, 4 servings). */
export function emptyFormValues() {
  return {
    title: '',
    category: 'Hauptgericht',
    meals: [],
    servings: '4',
    workTime: '',
    totalTime: '',
    ingredients: '',
    steps: '',
    source: '',
    sourceUrl: '',
    notes: '',
  };
}

/** The form filled with a saved recipe. */
export function recipeToFormValues(recipe: Recipe) {
  return {
    title: recipe.title,
    category: recipe.category ?? '',
    meals: recipe.meals,
    servings: recipe.servings === undefined ? '' : String(recipe.servings),
    workTime: formatDurationInput(recipe.workMinutes),
    totalTime: formatDurationInput(recipe.totalMinutes),
    ingredients: recipe.ingredientsText,
    steps: recipe.stepsText,
    source: recipe.source ?? '',
    sourceUrl: recipe.sourceUrl ?? '',
    notes: recipe.notes ?? '',
  };
}

/** The values of a submitted form; missing fields count as empty. */
export function readFormData(formData: FormData) {
  const text = (name: RecipeFormField) => {
    const value = formData.get(name);
    return typeof value === 'string' ? value : '';
  };
  return {
    title: text('title'),
    category: text('category'),
    meals: formData.getAll('meals').filter((meal) => typeof meal === 'string'),
    servings: text('servings'),
    workTime: text('workTime'),
    totalTime: text('totalTime'),
    ingredients: text('ingredients'),
    steps: text('steps'),
    source: text('source'),
    sourceUrl: text('sourceUrl'),
    notes: text('notes'),
  };
}

/** Checks the form values and turns them into a RecipeInput. Blank text counts as empty. */
export function readFormValues(values: RecipeFormValues) {
  const invalidFields: RecipeFormField[] = [];
  const check = <T>(field: RecipeFormField, read: () => { valid: boolean; value?: T }) => {
    const result = read();
    if (!result.valid) invalidFields.push(field);
    return result.value;
  };

  const title = values.title.trim();
  if (title === '') invalidFields.push('title');
  const category = check('category', () => oneOf<Category>(values.category, CATEGORY_VALUES));
  const meals = check('meals', () => readMeals(values.meals));
  const servings = check('servings', () => readServings(values.servings));
  const workMinutes = check('workTime', () => readDuration(values.workTime));
  const totalMinutes = check('totalTime', () => readDuration(values.totalTime));
  const source = check('source', () => oneOf<Source>(values.source, SOURCES));
  const sourceUrl = check('sourceUrl', () => readUrl(values.sourceUrl));

  if (invalidFields.length > 0) return { valid: false as const, invalidFields };
  const input: RecipeInput = {
    title,
    category,
    meals: meals ?? [],
    servings,
    workMinutes,
    totalMinutes,
    ingredientsText: values.ingredients.trim(),
    stepsText: values.steps.trim(),
    source,
    sourceUrl,
    notes: values.notes.trim() || undefined,
  };
  return { valid: true as const, input };
}

// Empty is fine; anything else must be one of the known values.
function oneOf<T extends string>(text: string, allowed: readonly string[]) {
  const trimmed = text.trim();
  if (trimmed === '') return { valid: true };
  return allowed.includes(trimmed) ? { valid: true, value: trimmed as T } : { valid: false };
}

function readMeals(meals: string[]) {
  const valid = meals.every((meal) => MEAL_VALUES.includes(meal));
  return valid ? { valid, value: [...new Set(meals)] as Meal[] } : { valid };
}

function readServings(text: string) {
  const trimmed = text.trim();
  if (trimmed === '') return { valid: true };
  const servings = Number(trimmed);
  return WHOLE_NUMBER.test(trimmed) && servings > 0
    ? { valid: true, value: servings }
    : { valid: false };
}

function readDuration(text: string) {
  const result = parseDurationInput(text);
  return result.valid ? { valid: true, value: result.minutes } : { valid: false };
}

// Shown as a link, so only http(s), as in input.ts.
function readUrl(text: string) {
  const trimmed = text.trim();
  if (trimmed === '') return { valid: true };
  return z.url({ protocol: /^https?$/ }).safeParse(trimmed).success
    ? { valid: true, value: trimmed }
    : { valid: false };
}
