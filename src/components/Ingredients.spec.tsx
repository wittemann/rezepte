// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseIngredients } from '../lib/recipes/ingredients.ts';
import Ingredients from './Ingredients.tsx';

const ingredients = parseIngredients(
  ['Für den Teig:', '200 g Mehl', '2–3 EL Öl', 'ca. 1 Prise Salz', 'Pfeffer'].join('\n'),
);

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
});

afterEach(() => {
  render(null, container);
  container.remove();
});

function renderList(servings?: number) {
  act(() => {
    render(<Ingredients ingredients={ingredients} servings={servings} />, container);
  });
}

const button = (label: string) =>
  container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
const click = (label: string) =>
  act(() => {
    button(label).click();
  });
const amounts = () => [...container.querySelectorAll('li')].map((li) => li.textContent);
const servingsText = () => container.querySelector('[aria-live]')!.textContent;

describe('Ingredients', () => {
  it('shows headings, amounts and the rest of each line', () => {
    renderList(4);
    expect(amounts()).toEqual([
      'Für den Teig',
      '200 gMehl',
      '2–3 ELÖl',
      'ca. 1 PriseSalz',
      'Pfeffer',
    ]);
    expect(container.querySelector('h2')?.textContent).toBe('Zutaten');
  });

  it('starts at the recipe servings', () => {
    renderList(4);
    expect(servingsText()).toBe('4Portionen');
  });

  it('scales the amounts with the stepper', () => {
    renderList(4);
    click('Mehr Portionen');
    click('Mehr Portionen');
    expect(servingsText()).toBe('6Portionen');
    expect(amounts()[1]).toBe('300 gMehl');
    click('Weniger Portionen');
    click('Weniger Portionen');
    click('Weniger Portionen');
    expect(servingsText()).toBe('3Portionen');
    expect(amounts()[1]).toBe('150 gMehl');
  });

  it('goes in half steps below 2 servings, stops at ½, and uses the singular at 1', () => {
    renderList(2);
    click('Weniger Portionen');
    expect(servingsText()).toBe('1½Portionen');
    click('Weniger Portionen');
    expect(servingsText()).toBe('1Portion');
    click('Weniger Portionen');
    expect(servingsText()).toBe('½Portion');
    expect(button('Weniger Portionen').disabled).toBe(true);
  });

  it('has no stepper without servings and keeps the amounts as written', () => {
    renderList(undefined);
    expect(container.querySelector('button')).toBeNull();
    expect(amounts()[1]).toBe('200 gMehl');
  });
});
