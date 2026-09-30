// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Toast from './Toast.tsx';

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  render(null, container);
  container.remove();
});

function renderToast(message: string | null, onDone = vi.fn(), duration = 2000) {
  act(() => {
    render(<Toast message={message} onDone={onDone} duration={duration} />, container);
  });
  return onDone;
}

function advance(milliseconds: number) {
  act(() => {
    vi.advanceTimersByTime(milliseconds);
  });
}

function statusRegion() {
  return container.querySelector('[role="status"]');
}

describe('Toast', () => {
  it('always has the status region, also without a message', () => {
    renderToast(null);
    expect(statusRegion()).not.toBeNull();
    renderToast('Gespeichert');
    expect(statusRegion()).not.toBeNull();
  });

  it('has no text when the message is null', () => {
    renderToast(null);
    expect(statusRegion()?.textContent).toBe('');
  });

  it('shows the message', () => {
    renderToast('Bild hochgeladen');
    expect(statusRegion()?.textContent).toBe('Bild hochgeladen');
  });

  it('inserts the text into the same status region element', () => {
    renderToast(null);
    const region = statusRegion();
    renderToast('Gespeichert');
    expect(statusRegion()).toBe(region);
  });

  it('calls onDone once after the duration', () => {
    const onDone = renderToast('Gespeichert');
    advance(1999);
    expect(onDone).not.toHaveBeenCalled();
    advance(1);
    expect(onDone).toHaveBeenCalledOnce();
    advance(10_000);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('defaults to 2500 ms', () => {
    const onDone = vi.fn();
    act(() => {
      render(<Toast message="Gespeichert" onDone={onDone} />, container);
    });
    advance(2499);
    expect(onDone).not.toHaveBeenCalled();
    advance(1);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('does not call onDone when the message is cleared before the duration', () => {
    const onDone = renderToast('Gespeichert');
    advance(1000);
    renderToast(null, onDone);
    advance(5000);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('starts a full new timer when a message appears again', () => {
    const onDone = renderToast('Gespeichert');
    advance(100);
    renderToast(null, onDone);
    renderToast('Gespeichert', onDone);
    advance(1999);
    expect(onDone).not.toHaveBeenCalled();
    advance(1);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('restarts the timer when the message changes', () => {
    const onDone = renderToast('Eins');
    advance(1500);
    renderToast('Zwei', onDone);
    advance(1999);
    expect(onDone).not.toHaveBeenCalled();
    advance(1);
    expect(onDone).toHaveBeenCalledOnce();
    expect(statusRegion()?.textContent).toBe('Zwei');
  });

  it('does not restart the timer when only onDone changes identity', () => {
    const first = vi.fn();
    const second = vi.fn();
    renderToast('Gespeichert', first);
    advance(1500);
    renderToast('Gespeichert', second);
    advance(500);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('clears the timer on unmount', () => {
    const onDone = renderToast('Gespeichert');
    advance(1000);
    act(() => {
      render(null, container);
    });
    advance(5000);
    expect(onDone).not.toHaveBeenCalled();
  });
});
