// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Rating } from '../lib/recipes/fields.ts';
import { parseIngredients } from '../lib/recipes/ingredients.ts';
import CookingMode from './CookingMode.tsx';

const addPhoto = vi.hoisted(() => vi.fn());
const setRating = vi.hoisted(() => vi.fn());
vi.mock('astro:actions', () => ({ actions: { addPhoto, setRating } }));
const resizePhoto = vi.hoisted(() => vi.fn());
vi.mock('./resize-photo.ts', () => ({ resizePhoto }));

const steps = [
  { text: 'Zwiebeln würfeln.' },
  { text: 'Teig 10 Minuten ruhen lassen.', section: 'Teig' },
  { text: 'Backen.', section: 'Teig' },
];
const ingredients = parseIngredients(['Für den Teig:', '200 g Mehl', 'Salz'].join('\n'));

let container: HTMLElement;

beforeEach(() => {
  addPhoto.mockReset();
  setRating.mockReset();
  resizePhoto.mockReset();
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
  container = document.createElement('div');
  document.body.append(container);
});

afterEach(() => {
  render(null, container);
  container.remove();
});

function renderCooking(
  servings?: number,
  hasPhoto = true,
  onClose?: (recipeChanged: boolean) => void,
  chosenServings?: number,
  rating?: Rating,
) {
  act(() => {
    render(
      <CookingMode
        recipeId="recX1"
        hasPhoto={hasPhoto}
        rating={rating}
        recipeHref="/recipes/recX1"
        steps={steps}
        ingredients={ingredients}
        servings={servings}
        chosenServings={chosenServings}
        onClose={onClose}
      />,
      container,
    );
  });
}

/** Taps "Weiter" through all cooking steps to „Wie war’s?“. */
function toLastStep() {
  for (let step = 0; step < steps.length; step++) {
    act(() => {
      [...container.querySelectorAll('button')]
        .find((button) => button.textContent === 'Weiter')!
        .click();
    });
  }
}

describe('CookingMode', () => {
  it('shows the first step with its position, and a close link to the recipe', () => {
    renderCooking();
    expect(container.textContent).toContain('Schritt 1 von 3');
    expect(container.textContent).toContain('Zwiebeln würfeln.');
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/recipes/recX1');
  });

  it('has a progress dot per step and one for „Wie war’s?“, and marks the current one', () => {
    renderCooking();
    const dots = [...container.querySelectorAll('ol[aria-label="Fortschritt"] li')];
    expect(dots).toHaveLength(4);
    expect(dots.map((dot) => dot.getAttribute('aria-current'))).toEqual(['step', null, null, null]);
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

  it('scales the ingredients to the servings chosen on the recipe page', () => {
    renderCooking(4, true, undefined, 2);
    const sheet = container.querySelector('dialog')!;
    expect(sheet.querySelector('h2')?.textContent).toBe('Zutaten · 2 Portionen');
    expect([...sheet.querySelectorAll('li')][1].textContent).toBe('100 gMehl');
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
    const pointer = (type: string, clientX: number, selector = 'section') => {
      const target = container.querySelector(selector)!;
      act(() => {
        target.dispatchEvent(new MouseEvent(type, { clientX, bubbles: true }));
      });
    };
    const swipe = (from: number, to: number) => {
      pointer('pointerdown', from);
      pointer('pointermove', to);
      pointer('pointerup', to);
    };

    it('goes forward and back with the buttons and moves the progress dots', () => {
      renderCooking();
      expect(button('Voriger Schritt').disabled).toBe(true);

      click('Weiter');
      expect(stepText()).toBe('Teig 10 Minuten ruhen lassen.');
      expect(container.textContent).toContain('Schritt 2 von 3 · Teig');
      const dots = [...container.querySelectorAll('ol li')];
      expect(dots.map((dot) => dot.getAttribute('aria-current'))).toEqual([
        null,
        'step',
        null,
        null,
      ]);

      click('Voriger Schritt');
      expect(stepText()).toBe('Zwiebeln würfeln.');
    });

    it('ends with „Wie war’s?“ and a link back to the recipe instead of "Weiter"', () => {
      renderCooking();
      click('Weiter');
      click('Weiter');
      expect(stepText()).toBe('Backen.');
      click('Weiter');
      expect(container.textContent).toContain('Wie war’s?');
      expect(button('Weiter')).toBeUndefined();
      const skip = [...container.querySelectorAll('a')].find(
        (link) => link.textContent === 'Überspringen',
      );
      expect(skip?.getAttribute('href')).toBe('/recipes/recX1');
    });

    it('swipes left for the next step and right for the previous one', () => {
      renderCooking();
      swipe(200, 140);
      expect(stepText()).toBe('Teig 10 Minuten ruhen lassen.');
      swipe(140, 200);
      expect(stepText()).toBe('Zwiebeln würfeln.');
    });

    it('swipes anywhere on the page, not only on the card, but not in the ingredients sheet', () => {
      renderCooking();
      pointer('pointerdown', 200, 'main svg');
      pointer('pointermove', 140, 'main svg');
      expect(stepText()).toBe('Teig 10 Minuten ruhen lassen.');

      pointer('pointerdown', 140, 'dialog');
      pointer('pointermove', 200, 'dialog');
      expect(stepText()).toBe('Teig 10 Minuten ruhen lassen.');
    });

    it('counts a swipe that iOS ends with pointercancel instead of pointerup', () => {
      renderCooking();
      pointer('pointerdown', 200);
      pointer('pointermove', 140);
      pointer('pointercancel', 140);
      expect(stepText()).toBe('Teig 10 Minuten ruhen lassen.');
    });

    it('moves only one step per drag, however far it goes', () => {
      renderCooking();
      pointer('pointerdown', 300);
      pointer('pointermove', 240);
      pointer('pointermove', 100);
      pointer('pointerup', 100);
      expect(stepText()).toBe('Teig 10 Minuten ruhen lassen.');
    });

    it('ignores a drag shorter than 50 px and swipes past the ends', () => {
      renderCooking();
      swipe(200, 160);
      expect(stepText()).toBe('Zwiebeln würfeln.');
      swipe(100, 200);
      expect(stepText()).toBe('Zwiebeln würfeln.');
    });
  });

  describe('„Wie war’s?“', () => {
    const tapStar = async (label: string) => {
      await act(async () => {
        container
          .querySelector<HTMLButtonElement>(`[role="radio"][aria-label="${label}"]`)!
          .click();
      });
    };
    const footerAction = () => container.querySelector('footer a');
    const level = () => container.querySelector('[aria-live="polite"]')?.textContent;
    const tastes = () => container.textContent!.includes('mmh?');

    it('asks for the rating with Maulti tasting, without the photo question', () => {
      renderCooking();
      toLastStep();
      expect(container.textContent).toContain('Letzter Schritt');
      expect(container.querySelector('section p')?.textContent).toBe('Wie war’s?');
      expect(container.querySelector('[role="radiogroup"]')?.getAttribute('aria-label')).toBe(
        'Bewertung: noch keine',
      );
      expect(level()).toBe('Noch nicht bewertet');
      expect(tastes()).toBe(true);
      expect(container.querySelector('input[type="file"]')).toBeNull();
      expect(footerAction()?.textContent).toBe('Überspringen');
    });

    it('saves a tapped star, shows the level, cheers and ends with "Fertig"', async () => {
      setRating.mockResolvedValue({ data: { rating: 5 } });
      renderCooking();
      toLastStep();

      await tapStar('5 Sterne');

      expect(setRating).toHaveBeenCalledWith({ id: 'recX1', rating: 5 });
      expect(level()).toBe('Mega lecker!');
      expect(tastes()).toBe(false);
      expect(footerAction()?.textContent).toBe('Fertig');
    });

    it('preselects the rating the recipe already has', () => {
      renderCooking(undefined, true, undefined, undefined, 3);
      toLastStep();
      expect(level()).toBe('Gut');
      expect(container.querySelector('[aria-checked="true"]')?.getAttribute('aria-label')).toBe(
        '3 Sterne',
      );
      expect(footerAction()?.textContent).toBe('Fertig');
    });

    it('goes back and shows a toast when saving fails', async () => {
      setRating.mockResolvedValue({ error: { code: 'INTERNAL_SERVER_ERROR' } });
      renderCooking();
      toLastStep();

      await tapStar('4 Sterne');

      expect(level()).toBe('Noch nicht bewertet');
      expect(container.querySelector('[role="status"]')?.textContent).toBe(
        'Das hat nicht geklappt. Bitte versuch es noch mal.',
      );
      expect(footerAction()?.textContent).toBe('Überspringen');
    });

    it('tells onClose whether the rating changed', async () => {
      setRating.mockResolvedValue({ data: { rating: 2 } });
      const onClose = vi.fn();
      renderCooking(undefined, true, onClose, undefined, 4);
      toLastStep();
      act(() => (footerAction() as HTMLElement).click());
      expect(onClose).toHaveBeenLastCalledWith(false);

      await tapStar('2 Sterne');
      act(() => (footerAction() as HTMLElement).click());
      expect(onClose).toHaveBeenLastCalledWith(true);
    });
  });

  describe('photo question', () => {
    const pickPhoto = async () => {
      const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
      Object.defineProperty(input, 'files', {
        value: [new File(['x'], 'IMG_1.jpg', { type: 'image/jpeg' })],
      });
      await act(async () => {
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    };
    const footerAction = () => container.querySelector('footer a, footer button:last-child');

    it('comes with the rating on the last step of a recipe without photo, no step of its own', () => {
      renderCooking(undefined, false);
      expect(container.querySelectorAll('ol li')).toHaveLength(4);
      toLastStep();
      expect(container.textContent).toContain('Letzter Schritt');
      expect(container.querySelector('section p')?.textContent).toBe('Juhu, geschafft! Wie war’s?');
      expect(container.querySelector('[role="radiogroup"]')).not.toBeNull();
      expect(container.textContent).toContain('Machst du noch ein Foto für mich?');
      const input = container.querySelector('input[type="file"]')!;
      expect(input.getAttribute('accept')).toBe('image/*');
      expect(input.getAttribute('capture')).toBe('environment');
      expect(footerAction()?.textContent).toBe('Überspringen');
      expect(footerAction()?.getAttribute('href')).toBe('/recipes/recX1');
    });

    it('uploads the shrunk photo for this recipe, shows it, and ends with "Fertig"', async () => {
      resizePhoto.mockResolvedValue({ blob: new Blob(['x']), base64: '/9j/AAAA' });
      addPhoto.mockResolvedValue({ error: undefined });
      renderCooking(undefined, false);
      toLastStep();
      await pickPhoto();

      expect(addPhoto).toHaveBeenCalledWith({ id: 'recX1', file: '/9j/AAAA' });
      expect(container.querySelector('img')?.getAttribute('src')).toBe('blob:preview');
      expect(container.textContent).toContain('Danke, das Foto ist gespeichert!');
      expect(container.querySelector('input[type="file"]')).toBeNull();
      expect(footerAction()?.textContent).toBe('Fertig');
    });

    it('tells onClose that a photo was added', async () => {
      resizePhoto.mockResolvedValue({ blob: new Blob(['x']), base64: '/9j/AAAA' });
      addPhoto.mockResolvedValue({ error: undefined });
      const onClose = vi.fn();
      renderCooking(undefined, false, onClose);
      toLastStep();
      await pickPhoto();

      act(() => (footerAction() as HTMLElement).click());
      expect(onClose).toHaveBeenCalledExactlyOnceWith(true);
    });

    it('cannot be left while the upload runs', async () => {
      resizePhoto.mockResolvedValue({ blob: new Blob(['x']), base64: '/9j/AAAA' });
      addPhoto.mockReturnValue(new Promise(() => {}));
      renderCooking(undefined, false);
      toLastStep();
      await pickPhoto();

      expect(container.textContent).toContain('Foto wird gespeichert');
      expect(container.querySelector('footer a')).toBeNull();
      expect(container.querySelector<HTMLButtonElement>('footer button:last-child')?.disabled).toBe(
        true,
      );
    });

    it('says so and offers another try when the upload fails', async () => {
      resizePhoto.mockResolvedValue({ blob: new Blob(['x']), base64: '/9j/AAAA' });
      addPhoto.mockResolvedValue({ error: new Error('boom') });
      renderCooking(undefined, false);
      toLastStep();
      await pickPhoto();

      expect(container.textContent).toContain('konnte nicht gespeichert werden');
      expect(container.textContent).toContain('Nochmal versuchen');
      expect(footerAction()?.textContent).toBe('Überspringen');
    });

    it('also fails gracefully when the photo cannot be read', async () => {
      resizePhoto.mockRejectedValue(new Error('not an image'));
      renderCooking(undefined, false);
      toLastStep();
      await pickPhoto();

      expect(addPhoto).not.toHaveBeenCalled();
      expect(container.textContent).toContain('konnte nicht gespeichert werden');
    });
  });

  describe('closing', () => {
    const closeLink = () =>
      container.querySelector<HTMLAnchorElement>('a[aria-label="Kochmodus beenden"]')!;
    const click = (element: HTMLElement) => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      act(() => {
        element.dispatchEvent(event);
      });
      return event;
    };

    it('follows the link to the recipe on a page of its own', () => {
      renderCooking();
      expect(click(closeLink()).defaultPrevented).toBe(false);
    });

    it('calls onClose instead when opened on the recipe page', () => {
      const onClose = vi.fn();
      renderCooking(undefined, true, onClose);
      expect(click(closeLink()).defaultPrevented).toBe(true);
      expect(onClose).toHaveBeenCalledExactlyOnceWith(false);
    });
  });
});
