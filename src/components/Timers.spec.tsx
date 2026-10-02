// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTimer } from '../lib/timers/timers.ts';
import { addTimer } from './timer-store.ts';
import Timers from './Timers.tsx';

const sound = vi.hoisted(() => ({ unlockSound: vi.fn(), playBeeps: vi.fn() }));
vi.mock('./timer-sound.ts', () => sound);

const START = new Date('2026-10-02T12:00:00Z').getTime();
let container: HTMLElement;
const reservedSpace = () => document.documentElement.style.getPropertyValue('--timer-space');

beforeEach(() => {
  vi.useFakeTimers({ now: START });
  localStorage.clear();
  sound.unlockSound.mockClear();
  sound.playBeeps.mockClear();
  // happy-dom has no layout: every pill is 40px high
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.querySelectorAll('li').length * 40;
  });
  // happy-dom has no <dialog> modal support to rely on
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  container = document.createElement('div');
  document.body.append(container);
  act(() => render(<Timers />, container));
});

afterEach(() => {
  act(() => render(null, container));
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const start = (minutes: number, stepNumber = 3) =>
  act(() =>
    addTimer(
      createTimer(
        { recipeTitle: 'Beispielsuppe', stepNumber, label: `${minutes} Minuten`, minutes },
        Date.now(),
      ),
    ),
  );
const pills = () => [...container.querySelectorAll('li')].map((pill) => pill.textContent);
const advance = (milliseconds: number) =>
  act(() => {
    vi.advanceTimersByTime(milliseconds);
  });

describe('Timers', () => {
  it('shows nothing without timers', () => {
    expect(container.innerHTML).toBe('');
  });

  it('shows a pill with the time left and counts down', () => {
    start(25);
    expect(pills()).toEqual(['25:00Beispielsuppe · Schritt 3✕']);
    advance(5000);
    expect(pills()[0]).toContain('24:55');
  });

  it('runs several timers next to each other and cancels one', () => {
    start(25, 3);
    start(10, 5);
    expect(pills()).toHaveLength(2);
    act(() => {
      container.querySelector<HTMLButtonElement>('button[aria-label="Timer abbrechen"]')!.click();
    });
    expect(pills()).toHaveLength(1);
    expect(pills()[0]).toContain('Schritt 5');
  });

  it('reserves the height of the pills at the top of the page while they run', () => {
    expect(reservedSpace()).toBe('');
    start(25);
    expect(reservedSpace()).toBe('40px');
  });

  it('gives the space back when the last pill is gone', () => {
    start(1);
    advance(60_500);
    expect(pills()).toEqual([]);
    expect(reservedSpace()).toBe('');
  });

  it('gives the space back when the timers leave the page', () => {
    start(5);
    act(() => render(null, container));
    expect(reservedSpace()).toBe('');
  });

  it('shows timers stored before, like after a page change', () => {
    start(5);
    act(() => render(null, container));
    act(() => render(<Timers />, container));
    expect(pills()).toHaveLength(1);
  });

  it('rings when a timer runs out: overlay, sound, then "Alles klar" clears it', () => {
    start(1, 4);
    advance(60_500);
    expect(pills()).toEqual([]);
    const dialog = container.querySelector('dialog')!;
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(dialog.textContent).toContain('Piep, piep! Zeit ist um.');
    expect(dialog.textContent).toContain('Beispielsuppe, Schritt 4: 1 Minuten sind um.');
    expect(sound.playBeeps).toHaveBeenCalled();

    const calls = sound.playBeeps.mock.calls.length;
    advance(2500);
    expect(sound.playBeeps.mock.calls.length).toBeGreaterThan(calls);

    act(() => dialog.querySelector('button')!.click());
    expect(container.querySelector('dialog')).toBeNull();
    expect(localStorage.getItem('timers')).toBe('[]');
  });

  it('rings straight away for a timer that ran out while the page was closed', () => {
    start(1);
    act(() => render(null, container));
    vi.setSystemTime(START + 10 * 60_000);
    act(() => render(<Timers />, container));
    expect(container.querySelector('dialog')).not.toBeNull();
  });

  it('prepares the sound on the first tap while timers run', () => {
    start(5);
    act(() => {
      document.dispatchEvent(new Event('pointerdown'));
    });
    expect(sound.unlockSound).toHaveBeenCalledOnce();
  });
});
