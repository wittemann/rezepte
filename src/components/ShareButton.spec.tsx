// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ShareButton from './ShareButton.tsx';

const share = vi.fn();
const writeText = vi.fn();

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  share.mockReset().mockResolvedValue(undefined);
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(() => {
  render(null, container);
  container.remove();
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(navigator, 'clipboard');
});

function renderButton(wide = false) {
  act(() => {
    render(
      <ShareButton title="Beispielrezept A" text={'Zeile 1\nZeile 2'} wide={wide} />,
      container,
    );
  });
}

const button = () => container.querySelector('button')!;
const toast = () => container.querySelector('[role="status"]')!.textContent;

async function tap() {
  await act(async () => {
    button().click();
    // Let share() and the clipboard fallback settle (several promise steps)
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('ShareButton', () => {
  it('is a round button labelled for screen readers', () => {
    renderButton();
    expect(button().getAttribute('aria-label')).toBe('Rezept teilen');
    expect(button().textContent).toBe('');
  });

  it('shows the label when it stands alone', () => {
    renderButton(true);
    expect(button().hasAttribute('aria-label')).toBe(false);
    expect(button().textContent).toBe('Rezept teilen');
  });

  it('opens the share sheet with title and text, without a toast', async () => {
    renderButton();
    await tap();
    expect(share).toHaveBeenCalledWith({ title: 'Beispielrezept A', text: 'Zeile 1\nZeile 2' });
    expect(writeText).not.toHaveBeenCalled();
    expect(toast()).toBe('');
  });

  it('does nothing when the share sheet is cancelled', async () => {
    share.mockRejectedValue(new DOMException('Cancelled', 'AbortError'));
    renderButton();
    await tap();
    expect(writeText).not.toHaveBeenCalled();
    expect(toast()).toBe('');
  });

  it('copies the text and says so without a share sheet', async () => {
    Reflect.deleteProperty(navigator, 'share');
    renderButton();
    await tap();
    expect(writeText).toHaveBeenCalledWith('Zeile 1\nZeile 2');
    expect(toast()).toBe('Rezept kopiert. Du kannst es jetzt einfügen.');
  });

  it('copies the text when the share sheet refuses', async () => {
    share.mockRejectedValue(new DOMException('Not allowed', 'NotAllowedError'));
    renderButton();
    await tap();
    expect(writeText).toHaveBeenCalledWith('Zeile 1\nZeile 2');
    expect(toast()).toBe('Rezept kopiert. Du kannst es jetzt einfügen.');
  });

  it('says so when copying fails', async () => {
    Reflect.deleteProperty(navigator, 'share');
    writeText.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    renderButton();
    await tap();
    expect(toast()).toBe('Kopieren hat nicht geklappt. Bitte versuch es noch mal.');
  });

  it('ignores a second tap while the share sheet is open', async () => {
    let close = () => {};
    share.mockReturnValue(new Promise<void>((resolve) => (close = resolve)));
    renderButton();
    await tap();
    await tap();
    expect(share).toHaveBeenCalledTimes(1);
    await act(async () => close());
    await tap();
    expect(share).toHaveBeenCalledTimes(2);
  });
});
