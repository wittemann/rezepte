// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Rating } from '../lib/recipes/fields.ts';
import RecipeRating from './RecipeRating.tsx';

const setRating = vi.hoisted(() => vi.fn());
vi.mock('astro:actions', () => ({ actions: { setRating } }));

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  setRating.mockReset();
});

afterEach(() => {
  render(null, container);
  container.remove();
});

function renderRating(rating: Rating | undefined) {
  act(() => {
    render(<RecipeRating recipeId="recTest1" rating={rating} />, container);
  });
}

const group = () => container.querySelector('[role="radiogroup"]')!;
const stars = () => [...container.querySelectorAll('[role="radio"]')];
const checked = () => stars().filter((star) => star.getAttribute('aria-checked') === 'true');
const filledCount = () => container.querySelectorAll('svg[class*="filled"]').length;
const caption = () => container.querySelector('p')!.textContent;
const toast = () => container.querySelector('[role="status"]')!.textContent;

async function tapStar(value: number) {
  await act(async () => {
    (stars()[value - 1] as HTMLButtonElement).click();
  });
}

describe('RecipeRating', () => {
  it('invites to rate when the recipe has no rating', () => {
    renderRating(undefined);
    expect(group().getAttribute('aria-label')).toBe('Bewertung: noch keine');
    expect(stars().map((star) => star.getAttribute('aria-label'))).toEqual([
      '1 Stern',
      '2 Sterne',
      '3 Sterne',
      '4 Sterne',
      '5 Sterne',
    ]);
    expect(checked()).toEqual([]);
    expect(filledCount()).toBe(0);
    expect(caption()).toBe('Wie war’s? Tipp auf einen Stern.');
  });

  it('shows the rating it was rendered with', () => {
    renderRating(4);
    expect(group().getAttribute('aria-label')).toBe('Bewertung: 4 von 5 Sternen');
    expect(checked().map((star) => star.getAttribute('aria-label'))).toEqual(['4 Sterne']);
    expect(filledCount()).toBe(4);
    expect(caption()).toBe('Richtig gut');
  });

  it('saves a tapped star and shows it before the server answers', async () => {
    setRating.mockReturnValue(new Promise(() => {})); // never answers
    renderRating(undefined);

    await tapStar(3);

    expect(setRating).toHaveBeenCalledWith({ id: 'recTest1', rating: 3 });
    expect(filledCount()).toBe(3);
    expect(caption()).toBe('Gut');
  });

  it('removes the rating when the selected star is tapped again', async () => {
    setRating.mockResolvedValue({ data: { rating: null } });
    renderRating(2);

    await tapStar(2);

    expect(setRating).toHaveBeenCalledWith({ id: 'recTest1', rating: null });
    expect(checked()).toEqual([]);
    expect(caption()).toBe('Wie war’s? Tipp auf einen Stern.');
  });

  it('goes back to the saved rating and shows a toast when saving fails', async () => {
    setRating.mockResolvedValue({ error: { code: 'INTERNAL_SERVER_ERROR' } });
    renderRating(2);

    await tapStar(5);

    expect(filledCount()).toBe(2);
    expect(toast()).toBe('Das hat nicht geklappt. Bitte versuch es noch mal.');
  });

  it('keeps a newer tap when an older save fails late', async () => {
    let failFirst: (value: unknown) => void = () => {};
    setRating
      .mockReturnValueOnce(new Promise((resolve) => (failFirst = resolve)))
      .mockResolvedValueOnce({ data: { rating: 4 } });
    renderRating(undefined);

    await tapStar(2);
    await tapStar(4);
    await act(async () => failFirst({ error: { code: 'INTERNAL_SERVER_ERROR' } }));

    expect(filledCount()).toBe(4);
    expect(toast()).toBe('');
  });
});
