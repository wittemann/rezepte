// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseIngredients } from '../lib/recipes/ingredients.ts';
import CookingMode from './CookingMode.tsx';

const steps = [
  { text: 'Zwiebeln würfeln.' },
  { text: 'Teig 10 Minuten ruhen lassen.', section: 'Teig', timerMinutes: 10 },
  { text: 'Backen.', section: 'Teig' },
];
const ingredients = parseIngredients(['Für den Teig:', '200 g Mehl', 'Salz'].join('\n'));

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
});

afterEach(() => {
  render(null, container);
  container.remove();
});

function renderCooking(servings?: number) {
  act(() => {
    render(
      <CookingMode
        recipeHref="/rezepte/recX1"
        steps={steps}
        ingredients={ingredients}
        servings={servings}
      />,
      container,
    );
  });
}

describe('CookingMode', () => {
  it('shows the first step with its position, and a close link to the recipe', () => {
    renderCooking();
    expect(container.textContent).toContain('Schritt 1 von 3');
    expect(container.textContent).toContain('Zwiebeln würfeln.');
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/rezepte/recX1');
  });

  it('has a progress dot per step and marks the current one', () => {
    renderCooking();
    const dots = [...container.querySelectorAll('ol[aria-label="Fortschritt"] li')];
    expect(dots).toHaveLength(3);
    expect(dots.map((dot) => dot.getAttribute('aria-current'))).toEqual(['step', null, null]);
  });

  it('opens the ingredients with the number of servings in the title', () => {
    renderCooking(4);
    const sheet = container.querySelector('dialog')!;
    expect(sheet.open).toBe(false);
    act(() => {
      [...container.querySelectorAll('button')]
        .find((button) => button.textContent === 'Zutaten')!
        .click();
    });
    expect(sheet.open).toBe(true);
    expect(sheet.querySelector('h2')?.textContent).toBe('Zutaten · 4 Portionen');
    expect([...sheet.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      'Für den Teig',
      '200 gMehl',
      'Salz',
    ]);
  });

  it('titles the ingredients without servings when the recipe has none', () => {
    renderCooking();
    expect(container.querySelector('dialog h2')?.textContent).toBe('Zutaten');
  });
});
