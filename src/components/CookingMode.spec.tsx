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

  describe('moving between steps', () => {
    const stepText = () => container.querySelector('section p:nth-child(2)')?.textContent;
    const button = (name: string) =>
      [...container.querySelectorAll('button')].find(
        (candidate) =>
          candidate.textContent === name || candidate.getAttribute('aria-label') === name,
      )!;
    const click = (name: string) => act(() => button(name).click());
    const swipe = (from: number, to: number) => {
      const card = container.querySelector('section')!;
      act(() => {
        card.dispatchEvent(new MouseEvent('pointerdown', { clientX: from, bubbles: true }));
      });
      act(() => {
        card.dispatchEvent(new MouseEvent('pointerup', { clientX: to, bubbles: true }));
      });
    };

    it('goes forward and back with the buttons and moves the progress dots', () => {
      renderCooking();
      expect(button('Voriger Schritt').disabled).toBe(true);

      click('Weiter');
      expect(stepText()).toBe('Teig 10 Minuten ruhen lassen.');
      expect(container.textContent).toContain('Schritt 2 von 3 · Teig');
      const dots = [...container.querySelectorAll('ol li')];
      expect(dots.map((dot) => dot.getAttribute('aria-current'))).toEqual([null, 'step', null]);

      click('Voriger Schritt');
      expect(stepText()).toBe('Zwiebeln würfeln.');
    });

    it('ends with a "Fertig" link back to the recipe instead of "Weiter"', () => {
      renderCooking();
      click('Weiter');
      click('Weiter');
      expect(stepText()).toBe('Backen.');
      expect(button('Weiter')).toBeUndefined();
      const done = [...container.querySelectorAll('a')].find(
        (link) => link.textContent === 'Fertig',
      );
      expect(done?.getAttribute('href')).toBe('/rezepte/recX1');
    });

    it('swipes left for the next step and right for the previous one', () => {
      renderCooking();
      swipe(200, 140);
      expect(stepText()).toBe('Teig 10 Minuten ruhen lassen.');
      swipe(140, 200);
      expect(stepText()).toBe('Zwiebeln würfeln.');
    });

    it('ignores a drag shorter than 50 px and swipes past the ends', () => {
      renderCooking();
      swipe(200, 160);
      expect(stepText()).toBe('Zwiebeln würfeln.');
      swipe(100, 200);
      expect(stepText()).toBe('Zwiebeln würfeln.');
    });
  });
});
