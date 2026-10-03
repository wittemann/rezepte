// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CookingLauncher from './CookingLauncher.tsx';

vi.mock('astro:actions', () => ({ actions: { addPhoto: vi.fn() } }));

const RECIPE_HREF = '/rezepte/recX1';
const COOK_HREF = '/rezepte/recX1/cook';

let page: HTMLElement;
let link: HTMLAnchorElement;
let container: HTMLElement;

beforeEach(() => {
  history.replaceState(null, '', RECIPE_HREF);
  // The recipe page as the server renders it, with the cook button
  page = document.createElement('main');
  page.setAttribute('data-recipe-page', '');
  link = document.createElement('a');
  link.href = COOK_HREF;
  link.textContent = 'Los, wir kochen!';
  page.append(link);
  container = document.createElement('div');
  document.body.append(page, container);
  act(() => {
    render(
      <CookingLauncher
        recipeId="recX1"
        recipeHref={RECIPE_HREF}
        cookHref={COOK_HREF}
        hasPhoto
        steps={[{ text: 'Zwiebeln würfeln.' }]}
        ingredients={[]}
      />,
      container,
    );
  });
});

afterEach(() => {
  render(null, container);
  page.remove();
  container.remove();
});

const cookingIsOpen = () => container.querySelector('[aria-label="Kochmodus beenden"]') !== null;

function clickLink(init: MouseEventInit = {}) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
  act(() => {
    link.dispatchEvent(event);
  });
  return event;
}

function goBack() {
  act(() => {
    history.replaceState(null, '', RECIPE_HREF);
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
  });
}

describe('CookingLauncher', () => {
  it('opens cooking mode on the recipe page instead of loading /cook', () => {
    const event = clickLink();
    expect(event.defaultPrevented).toBe(true);
    expect(cookingIsOpen()).toBe(true);
    expect(page.hidden).toBe(true);
    expect(location.pathname).toBe(COOK_HREF);
  });

  it('closes it again with the back button', () => {
    clickLink();
    goBack();
    expect(cookingIsOpen()).toBe(false);
    expect(page.hidden).toBe(false);
  });

  it('goes back in history when cooking mode is closed', () => {
    const back = vi.spyOn(history, 'back').mockImplementation(() => {});
    clickLink();
    act(() => {
      container.querySelector<HTMLElement>('[aria-label="Kochmodus beenden"]')!.click();
    });
    expect(back).toHaveBeenCalledOnce();
    back.mockRestore();
  });

  it('leaves a click with a modifier key to the browser (new tab)', () => {
    const event = clickLink({ metaKey: true });
    expect(event.defaultPrevented).toBe(false);
    expect(cookingIsOpen()).toBe(false);
  });
});
