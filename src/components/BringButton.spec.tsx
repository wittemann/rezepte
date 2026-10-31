// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseIngredients } from '../lib/recipes/ingredients.ts';
import BringButton from './BringButton.tsx';

const addToBring = vi.hoisted(() => vi.fn());
vi.mock('astro:actions', () => ({ actions: { addToBring } }));

// Positions: 0 heading, 1 Mehl, 2 Eier, 3 Salz
const ingredients = parseIngredients(['Für den Teig:', '200 g Mehl', '2 Eier', 'Salz'].join('\n'));

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  addToBring.mockReset();
  addToBring.mockResolvedValue({ data: { added: 3 } });
});

afterEach(() => {
  render(null, container);
  container.remove();
});

function renderButton(servings?: number) {
  act(() => {
    render(
      <BringButton
        recipeId="recTest1"
        ingredients={ingredients}
        servings={servings}
        baseServings={servings ? 4 : undefined}
      />,
      container,
    );
  });
}

const buttonNamed = (name: string) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === name)!;
const submitButton = () => container.querySelector<HTMLButtonElement>('button[aria-busy]')!;
const checkboxes = () => [...container.querySelectorAll<HTMLInputElement>('input[type=checkbox]')];
const rows = () => [...container.querySelectorAll('label')].map((label) => label.textContent);
const sheetIsOpen = () => container.querySelector('dialog')!.open;
const toast = () => container.querySelector('[role="status"]')!.textContent;

async function press(button: HTMLElement) {
  await act(async () => {
    button.click();
  });
}

const openSheet = () => press(buttonNamed('Auf die Einkaufsliste'));

describe('BringButton', () => {
  it('opens a sheet with every ingredient checked, headings without a checkbox', async () => {
    renderButton(4);
    await openSheet();

    expect(sheetIsOpen()).toBe(true);
    expect(rows()).toEqual(['200 gMehl', '2Eier', 'Salz']);
    expect(checkboxes().every((box) => box.checked)).toBe(true);
    expect(container.querySelector('dialog')!.textContent).toContain('Für den Teig');
    expect(submitButton().textContent).toBe('3 Zutaten zu Bring! hinzufügen');
  });

  it('shows the amounts for the chosen servings', async () => {
    renderButton(8);
    await openSheet();
    expect(rows()[0]).toBe('400 gMehl');
    expect(container.textContent).toContain('Für 8 Portionen.');
  });

  it('counts down when lines are unchecked and sends only the checked ones', async () => {
    renderButton(4);
    await openSheet();
    await press(checkboxes()[2]); // Salz

    expect(container.textContent).toContain('2 von 3 ausgewählt');
    await press(submitButton());
    expect(addToBring).toHaveBeenCalledWith({ id: 'recTest1', servings: 4, lines: [1, 2] });
  });

  it('cannot send when nothing is checked', async () => {
    renderButton(4);
    await openSheet();
    await press(buttonNamed('Keine'));

    expect(submitButton().disabled).toBe(true);
    expect(submitButton().textContent).toBe('Nichts ausgewählt');
    await press(buttonNamed('Alle'));
    expect(checkboxes().every((box) => box.checked)).toBe(true);
  });

  it('closes the sheet and shows a toast once the items are added', async () => {
    renderButton(4);
    await openSheet();
    await press(submitButton());

    expect(sheetIsOpen()).toBe(false);
    expect(toast()).toBe('3 Zutaten sind auf der Einkaufsliste.');
  });

  it('keeps the sheet and the picks on an error and offers to try again', async () => {
    addToBring.mockResolvedValue({ error: { code: 'INTERNAL_SERVER_ERROR' } });
    renderButton(4);
    await openSheet();
    await press(checkboxes()[0]);
    await press(submitButton());

    expect(sheetIsOpen()).toBe(true);
    expect(container.querySelector('[role="alert"]')!.textContent).toContain('nicht erreichbar');
    expect(checkboxes().map((box) => box.checked)).toEqual([false, true, true]);
    expect(submitButton().textContent).toBe('Noch mal versuchen');
  });

  it('starts with every line checked again on the next opening', async () => {
    renderButton(4);
    await openSheet();
    await press(buttonNamed('Keine'));
    await act(async () => {
      container.querySelector('dialog')!.close();
    });
    await openSheet();
    expect(checkboxes().every((box) => box.checked)).toBe(true);
  });

  it('leaves the servings out for a recipe without them', async () => {
    renderButton();
    await openSheet();
    expect(container.textContent).not.toContain('Portion');
    await press(submitButton());
    expect(addToBring).toHaveBeenCalledWith({
      id: 'recTest1',
      servings: undefined,
      lines: [1, 2, 3],
    });
  });
});
