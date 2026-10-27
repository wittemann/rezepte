// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DeleteRecipe from './DeleteRecipe.tsx';

const deleteRecipe = vi.hoisted(() => vi.fn());
vi.mock('astro:actions', () => ({ actions: { deleteRecipe } }));

let container: HTMLElement;

beforeEach(() => {
  history.replaceState(null, '', '/recipes/recTest1/edit');
  container = document.createElement('div');
  document.body.append(container);
  deleteRecipe.mockReset();
  act(() => {
    render(<DeleteRecipe recipeId="recTest1" title="Testsuppe" />, container);
  });
});

afterEach(() => {
  render(null, container);
  container.remove();
});

const buttonNamed = (name: string) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent === name)!;
const sheetIsOpen = () => container.querySelector('dialog')!.open;
const toast = () => container.querySelector('[role="status"]')!.textContent;

async function press(name: string) {
  await act(async () => {
    buttonNamed(name).click();
  });
}

describe('DeleteRecipe', () => {
  it('asks first, naming the recipe, and deletes nothing yet', async () => {
    await press('Rezept löschen');

    expect(sheetIsOpen()).toBe(true);
    expect(container.querySelector('dialog')!.textContent).toContain('„Testsuppe“');
    expect(deleteRecipe).not.toHaveBeenCalled();
  });

  it('closes the sheet on „Abbrechen“ without deleting', async () => {
    await press('Rezept löschen');
    await press('Abbrechen');

    expect(sheetIsOpen()).toBe(false);
    expect(deleteRecipe).not.toHaveBeenCalled();
  });

  it('deletes the recipe and goes to the list', async () => {
    deleteRecipe.mockResolvedValue({ data: undefined });
    await press('Rezept löschen');
    await press('Löschen');

    expect(deleteRecipe).toHaveBeenCalledWith({ id: 'recTest1' });
    expect(location.pathname).toBe('/recipes');
  });

  it('goes to the list as well when the recipe is gone already', async () => {
    deleteRecipe.mockResolvedValue({ error: { code: 'NOT_FOUND' } });
    await press('Rezept löschen');
    await press('Löschen');

    expect(location.pathname).toBe('/recipes');
  });

  it('disables the buttons while deleting, so a second tap sends nothing', async () => {
    deleteRecipe.mockReturnValue(new Promise(() => {})); // never answers
    await press('Rezept löschen');
    await press('Löschen');

    expect(buttonNamed('Wird gelöscht …').disabled).toBe(true);
    expect(buttonNamed('Abbrechen').disabled).toBe(true);
    expect(deleteRecipe).toHaveBeenCalledOnce();
  });

  it('stays on the page and shows a toast when deleting fails', async () => {
    deleteRecipe.mockResolvedValue({ error: { code: 'INTERNAL_SERVER_ERROR' } });
    await press('Rezept löschen');
    await press('Löschen');

    expect(location.pathname).toBe('/recipes/recTest1/edit');
    expect(sheetIsOpen()).toBe(true);
    expect(buttonNamed('Löschen').disabled).toBe(false);
    expect(toast()).toBe('Das hat nicht geklappt. Bitte versuch es noch mal.');
  });
});
