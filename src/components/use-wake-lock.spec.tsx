// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWakeLock } from './use-wake-lock.ts';

function Screen() {
  useWakeLock();
  return null;
}

const release = vi.fn(async () => {});
// The lock's "release" listener, called when the browser drops the lock (page hidden)
let onBrowserRelease: (() => void) | undefined;
const addEventListener = vi.fn((_type: string, listener: () => void) => {
  onBrowserRelease = listener;
});
const request = vi.fn(async () => ({ release, addEventListener }));
let container: HTMLElement;

beforeEach(() => {
  release.mockClear();
  request.mockClear();
  onBrowserRelease = undefined;
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
  container = document.createElement('div');
  document.body.append(container);
});

afterEach(() => {
  render(null, container);
  container.remove();
  Reflect.deleteProperty(navigator, 'wakeLock');
});

const mount = () => act(() => render(<Screen />, container));
const flush = () => act(async () => {});

describe('useWakeLock', () => {
  it('requests a screen lock and releases it on unmount', async () => {
    mount();
    await flush();
    expect(request).toHaveBeenCalledWith('screen');
    expect(release).not.toHaveBeenCalled();

    act(() => render(null, container));
    expect(release).toHaveBeenCalledOnce();
  });

  it('requests the lock again when the page comes back after the browser dropped it', async () => {
    mount();
    await flush();
    act(() => {
      onBrowserRelease?.();
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await flush();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('requests the lock again on the next tap when it was refused (Safari)', async () => {
    request.mockRejectedValueOnce(new DOMException('No user activation', 'NotAllowedError'));
    mount();
    await flush();

    act(() => {
      document.body.dispatchEvent(new Event('click', { bubbles: true }));
    });
    await flush();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does not request it again while it is held', async () => {
    mount();
    await flush();
    act(() => {
      document.body.dispatchEvent(new Event('click', { bubbles: true }));
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await flush();
    expect(request).toHaveBeenCalledOnce();
  });

  it('stops listening for taps on unmount', async () => {
    request.mockRejectedValueOnce(new DOMException('No user activation', 'NotAllowedError'));
    mount();
    await flush();
    act(() => render(null, container));

    document.body.dispatchEvent(new Event('click', { bubbles: true }));
    await flush();
    expect(request).toHaveBeenCalledOnce();
  });

  it('releases a lock that arrives after unmount', async () => {
    mount();
    act(() => render(null, container));
    await flush();
    expect(release).toHaveBeenCalledOnce();
  });

  it('survives a refused request and browsers without the API', async () => {
    request.mockRejectedValueOnce(new Error('NotAllowedError'));
    mount();
    await flush();
    act(() => render(null, container));

    Reflect.deleteProperty(navigator, 'wakeLock');
    expect(() => mount()).not.toThrow();
  });
});
