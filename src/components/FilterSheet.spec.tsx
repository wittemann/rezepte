// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import FilterSheet from './FilterSheet.tsx';

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
});

afterEach(() => {
  render(null, container);
  container.remove();
});

// The page renders the form; this one has the parts the island works with.
// `children` are given as markup here, like the static HTML Astro passes in.
const FORM = `
  <form>
    <input type="checkbox" name="category" value="soup" />
    <input type="checkbox" name="category" value="salad" />
    <input type="checkbox" name="max30" value="1" />
    <input type="checkbox" name="steps" value="1" />
    <button type="submit"><span data-apply-label>initial</span></button>
  </form>`;

const recipes = [
  { category: 'Suppe', totalMinutes: 20, hasInstructions: true },
  { category: 'Suppe', totalMinutes: 90, hasInstructions: true },
  { category: 'Salat', totalMinutes: 10, hasInstructions: false },
  { category: undefined, totalMinutes: undefined, hasInstructions: true },
];

function renderSheet() {
  act(() => {
    render(
      <FilterSheet
        recipes={recipes}
        opener={
          <button type="button" data-filter-opener>
            <span>Filter</span>
          </button>
        }
        reset={<a href="/recipes">Zurücksetzen</a>}
      >
        <div dangerouslySetInnerHTML={{ __html: FORM }} />
      </FilterSheet>,
      container,
    );
  });
}

const dialog = () => container.querySelector('dialog') as HTMLDialogElement;
const opener = () => container.querySelector('[data-filter-opener]') as HTMLButtonElement;
const applyLabel = () => container.querySelector('[data-apply-label]')?.textContent;

function toggle(selector: string) {
  const input = container.querySelector(selector) as HTMLInputElement;
  act(() => {
    input.checked = !input.checked;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('FilterSheet', () => {
  it('opens the sheet when the marked opener is clicked', () => {
    renderSheet();
    expect(dialog().open).toBe(false);
    act(() => opener().click());
    expect(dialog().open).toBe(true);
  });

  it('opens from an element inside the opener, which is how a click on its text arrives', () => {
    renderSheet();
    act(() => (opener().querySelector('span') as HTMLElement).click());
    expect(dialog().open).toBe(true);
  });

  it('ignores clicks that are not on the opener', () => {
    renderSheet();
    act(() => container.querySelector<HTMLElement>('div')!.click());
    expect(dialog().open).toBe(false);
  });

  it('shows the reset link in the header and the form as content', () => {
    renderSheet();
    expect(dialog().querySelector('a')?.textContent).toBe('Zurücksetzen');
    expect(dialog().querySelector('form')).not.toBeNull();
  });

  it('counts the matching recipes at the start', () => {
    renderSheet();
    expect(applyLabel()).toBe('4 Rezepte anzeigen');
  });

  it('recounts when a chip is toggled', () => {
    renderSheet();
    toggle('[value=soup]');
    expect(applyLabel()).toBe('2 Rezepte anzeigen');
    toggle('[value=salad]');
    expect(applyLabel()).toBe('3 Rezepte anzeigen');
    toggle('[name=max30]');
    expect(applyLabel()).toBe('2 Rezepte anzeigen');
    toggle('[name=steps]');
    expect(applyLabel()).toBe('1 Rezept anzeigen');
    toggle('[name=max30]');
    toggle('[name=steps]');
    toggle('[value=soup]');
    toggle('[value=salad]');
    expect(applyLabel()).toBe('4 Rezepte anzeigen');
  });
});
