// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CalendarButton from './CalendarButton.tsx';

let container: HTMLElement;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 18, 9, 0)); // Sunday, local time
  container = document.createElement('div');
  document.body.append(container);
  act(() => {
    render(<CalendarButton recipeId="recTest1" />, container);
  });
});

afterEach(() => {
  render(null, container);
  container.remove();
  vi.useRealTimers();
});

const button = () => container.querySelector<HTMLButtonElement>('button[aria-label]')!;
const links = () => [...container.querySelectorAll('a')];

function openSheet() {
  act(() => {
    button().click();
  });
}

describe('CalendarButton', () => {
  it('has no days until the sheet is opened', () => {
    expect(button().getAttribute('aria-label')).toBe('In den Kalender');
    expect(links()).toHaveLength(0);
  });

  it('opens the sheet with a link per day to the calendar route', () => {
    openSheet();

    expect(container.querySelector('dialog')?.hasAttribute('open')).toBe(true);
    expect(container.querySelector('h2')?.textContent).toBe('Wann gibt’s das?');
    expect(links().map((link) => link.getAttribute('href'))).toEqual([
      '/recipes/recTest1/calendar.ics?date=2026-10-19',
      '/recipes/recTest1/calendar.ics?date=2026-10-20',
      '/recipes/recTest1/calendar.ics?date=2026-10-21',
      '/recipes/recTest1/calendar.ics?date=2026-10-22',
      '/recipes/recTest1/calendar.ics?date=2026-10-23',
      '/recipes/recTest1/calendar.ics?date=2026-10-24',
      '/recipes/recTest1/calendar.ics?date=2026-10-25',
    ]);
    expect(links()[0].textContent).toBe('Montag19. Okt.');
    expect(links()[6].textContent).toBe('Sonntag25. Okt.');
  });

  it('works out the days again each time it opens', () => {
    openSheet();
    act(() => {
      container.querySelector('dialog')!.close();
    });

    vi.setSystemTime(new Date(2026, 9, 19, 9, 0)); // the page stayed open overnight
    openSheet();

    expect(links()[0].getAttribute('href')).toBe('/recipes/recTest1/calendar.ics?date=2026-10-26');
  });
});
