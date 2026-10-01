// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FavoriteButton from './FavoriteButton.tsx';

const setFavorite = vi.hoisted(() => vi.fn());
vi.mock('astro:actions', () => ({ actions: { setFavorite } }));

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  setFavorite.mockReset();
});

afterEach(() => {
  render(null, container);
  container.remove();
});

function renderButton(favorite: boolean) {
  act(() => {
    render(<FavoriteButton recipeId="recTest1" favorite={favorite} />, container);
  });
}

const button = () => container.querySelector('button')!;
const toast = () => container.querySelector('[role="status"]')!.textContent;

async function click() {
  await act(async () => {
    button().click();
  });
}

describe('FavoriteButton', () => {
  it('shows the state it was rendered with', () => {
    renderButton(true);
    expect(button().getAttribute('aria-pressed')).toBe('true');
    expect(button().getAttribute('aria-label')).toBe('Aus den Favoriten entfernen');
    expect(container.querySelector('svg')?.getAttribute('fill')).toBe('currentColor');
  });

  it('marks the recipe as favorite and keeps the heart', async () => {
    setFavorite.mockResolvedValue({ data: { favoritedAt: '2026-10-01T08:30:00.000Z' } });
    renderButton(false);
    expect(button().getAttribute('aria-label')).toBe('Als Favorit markieren');

    await click();

    expect(setFavorite).toHaveBeenCalledWith({ id: 'recTest1', favorite: true });
    expect(button().getAttribute('aria-pressed')).toBe('true');
    expect(toast()).toBe('');
  });

  it('removes the favorite', async () => {
    setFavorite.mockResolvedValue({ data: {} });
    renderButton(true);

    await click();

    expect(setFavorite).toHaveBeenCalledWith({ id: 'recTest1', favorite: false });
    expect(button().getAttribute('aria-pressed')).toBe('false');
  });

  it('changes the heart before the server answers', async () => {
    setFavorite.mockReturnValue(new Promise(() => {})); // never answers
    renderButton(false);

    await click();

    expect(button().getAttribute('aria-pressed')).toBe('true');
  });

  it('goes back and shows a toast when saving fails', async () => {
    setFavorite.mockResolvedValue({ error: { code: 'INTERNAL_SERVER_ERROR' } });
    renderButton(false);

    await click();

    expect(button().getAttribute('aria-pressed')).toBe('false');
    expect(toast()).toBe('Das hat nicht geklappt. Bitte versuch es noch mal.');
  });
});
