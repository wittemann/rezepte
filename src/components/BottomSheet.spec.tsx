// @vitest-environment happy-dom
// happy-dom's <dialog> only toggles the `open` attribute and fires `close`. These tests
// prove the sheet's own code paths; Escape, focus trap and backdrop need a real browser.
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BottomSheet from './BottomSheet.tsx';

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
});

afterEach(() => {
  render(null, container);
  container.remove();
});

function renderSheet(open: boolean, onClose = vi.fn()) {
  act(() => {
    render(
      <BottomSheet open={open} onClose={onClose} title="Filter">
        <p class="inside">Inhalt</p>
      </BottomSheet>,
      container,
    );
  });
  return onClose;
}

function dialog() {
  return container.querySelector('dialog') as HTMLDialogElement;
}

function press(target: Element) {
  act(() => {
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

describe('BottomSheet', () => {
  it('is a modal dialog named by its title', () => {
    renderSheet(false);
    const heading = container.querySelector('h2') as HTMLElement;
    expect(heading.textContent).toBe('Filter');
    expect(dialog().getAttribute('aria-modal')).toBe('true');
    expect(dialog().getAttribute('aria-labelledby')).toBe(heading.id);
    expect(container.querySelector('button')?.getAttribute('aria-label')).toBe('Schließen');
  });

  it('opens and closes with the `open` prop', () => {
    const onClose = renderSheet(false);
    expect(dialog().open).toBe(false);
    renderSheet(true, onClose);
    expect(dialog().open).toBe(true);
    renderSheet(false, onClose);
    expect(dialog().open).toBe(false);
    // The parent closed it, so there's nothing to report back
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when the dialog closes on its own (e.g. Escape)', () => {
    const onClose = renderSheet(true);
    act(() => dialog().close());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ignores a stale close event that arrives after reopening', () => {
    const onClose = renderSheet(true);
    // In browsers `close` is queued, so it can arrive when the sheet is already open again
    act(() => {
      dialog().dispatchEvent(new Event('close'));
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(dialog().open).toBe(true);
  });

  it('closes on a backdrop click, not on a click inside', () => {
    const onClose = renderSheet(true);
    press(container.querySelector('.inside') as Element);
    expect(onClose).not.toHaveBeenCalled();
    // Clicks on the backdrop reach the <dialog> itself
    press(dialog());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes with the close button', () => {
    const onClose = renderSheet(true);
    press(container.querySelector('button') as Element);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows the header action instead of the close button', () => {
    act(() => {
      render(
        <BottomSheet open onClose={vi.fn()} title="Filter" headerAction={<a href="#">Reset</a>}>
          <p>Inhalt</p>
        </BottomSheet>,
        container,
      );
    });
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('a')?.textContent).toBe('Reset');
  });

  it('focuses the element that opened it again on close', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const onClose = renderSheet(true);
    (container.querySelector('button') as HTMLElement).focus();
    renderSheet(false, onClose);
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
