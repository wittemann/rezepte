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
const request = vi.fn(async () => ({ release }));
let container: HTMLElement;

beforeEach(() => {
  release.mockClear();
  request.mockClear();
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

  it('requests the lock again when the page becomes visible', async () => {
    mount();
    await flush();
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await flush();
    expect(request).toHaveBeenCalledTimes(2);
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
