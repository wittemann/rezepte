import { describe, expect, it } from 'vitest';
import {
  emptyFormValues,
  readFormData,
  readFormValues,
  recipeToFormValues,
  type RecipeFormValues,
} from './form.ts';
import { makeRecipe } from './test-recipe.ts';

/** A form with only a title, plus the given values. */
function testValues(values: Partial<RecipeFormValues> = {}) {
  return { ...emptyFormValues(), title: 'Testsuppe', ...values };
}

describe('readFormValues', () => {
  it('turns every field into a RecipeInput, trimmed', () => {
    const result = readFormValues({
      title: '  Testsuppe ',
      category: 'Suppe',
      meals: ['Frühstück', 'Mittag & Abend'],
      servings: ' 4 ',
      workTime: '0:20',
      totalTime: '1:05',
      ingredients: '250 g Testgemüse\nSalz\n',
      steps: ' 1. Alles 10 Minuten kochen.',
      source: 'Chefkoch',
      sourceUrl: ' https://example.org/testsuppe ',
      notes: ' Schmeckt auch kalt. ',
    });

    expect(result).toEqual({
      valid: true,
      input: {
        title: 'Testsuppe',
        category: 'Suppe',
        meals: ['Frühstück', 'Mittag & Abend'],
        servings: 4,
        workMinutes: 20,
        totalMinutes: 65,
        ingredientsText: '250 g Testgemüse\nSalz',
        stepsText: '1. Alles 10 Minuten kochen.',
        source: 'Chefkoch',
        sourceUrl: 'https://example.org/testsuppe',
        notes: 'Schmeckt auch kalt.',
      },
    });
  });

  it('leaves blank optional fields empty', () => {
    const result = readFormValues({ ...testValues(), category: ' ', servings: '', notes: '  ' });

    expect(result).toEqual({
      valid: true,
      input: {
        title: 'Testsuppe',
        meals: [],
        ingredientsText: '',
        stepsText: '',
      },
    });
  });

  it('drops a meal that was sent twice', () => {
    const result = readFormValues(testValues({ meals: ['Backen', 'Backen'] }));
    expect(result.valid && result.input.meals).toEqual(['Backen']);
  });

  it('names every invalid field', () => {
    const result = readFormValues({
      title: '   ',
      category: 'Unbekannt',
      meals: ['Brunch'],
      servings: '2,5',
      workTime: '20',
      totalTime: '1:75',
      ingredients: '',
      steps: '',
      source: 'Kochbuch',
      sourceUrl: 'javascript:alert(1)',
      notes: '',
    });

    expect(result).toEqual({
      valid: false,
      invalidFields: [
        'title',
        'category',
        'meals',
        'servings',
        'workTime',
        'totalTime',
        'source',
        'sourceUrl',
      ],
    });
  });

  it.each(['0', '-1', '4 Personen', '1e2'])('refuses %j as servings', (servings) => {
    expect(readFormValues(testValues({ servings }))).toEqual({
      valid: false,
      invalidFields: ['servings'],
    });
  });
});

describe('recipeToFormValues', () => {
  it('fills the form with a recipe, times as h:mm', () => {
    const recipe = makeRecipe({
      title: 'Testsuppe',
      category: 'Suppe',
      meals: ['Backen'],
      servings: 4,
      workMinutes: 20,
      totalMinutes: 65,
      ingredientsText: 'Salz',
      stepsText: '1. Kochen.',
      source: 'Chefkoch',
      sourceUrl: 'https://example.org/testsuppe',
      notes: 'Lecker.',
    });

    expect(recipeToFormValues(recipe)).toEqual({
      title: 'Testsuppe',
      category: 'Suppe',
      meals: ['Backen'],
      servings: '4',
      workTime: '0:20',
      totalTime: '1:05',
      ingredients: 'Salz',
      steps: '1. Kochen.',
      source: 'Chefkoch',
      sourceUrl: 'https://example.org/testsuppe',
      notes: 'Lecker.',
    });
  });

  it('reads back to the same recipe', () => {
    const recipe = makeRecipe({ title: 'Testsuppe', servings: 2, totalMinutes: 90 });
    const result = readFormValues(recipeToFormValues(recipe));

    expect(result.valid && result.input).toMatchObject({ servings: 2, totalMinutes: 90 });
  });
});

describe('readFormData', () => {
  it('reads the fields and all checked meals; missing fields are empty', () => {
    const formData = new FormData();
    formData.append('title', 'Testsuppe');
    formData.append('meals', 'Frühstück');
    formData.append('meals', 'Backen');

    expect(readFormData(formData)).toEqual({
      ...emptyFormValues(),
      title: 'Testsuppe',
      category: '',
      servings: '',
      meals: ['Frühstück', 'Backen'],
    });
  });
});
