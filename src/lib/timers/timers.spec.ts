import { describe, expect, it } from 'vitest';
import {
  createTimer,
  formatRemaining,
  isExpired,
  parseTimers,
  remainingSeconds,
  type Timer,
} from './timers.ts';

const timer: Timer = {
  id: 'a',
  recipeTitle: 'Beispielsuppe',
  stepNumber: 3,
  label: '25 Minuten',
  endsAt: 1_000_000,
};

describe('createTimer', () => {
  it('ends the given minutes from now, fractions included', () => {
    const created = createTimer(
      { recipeTitle: 'Beispielsuppe', stepNumber: 2, label: '2,5 Minuten', minutes: 2.5 },
      1000,
    );
    expect(created).toMatchObject({ stepNumber: 2, label: '2,5 Minuten', endsAt: 151_000 });
    expect(created.id).toBeTruthy();
  });

  it('gives every timer its own id', () => {
    const details = { recipeTitle: 'x', stepNumber: 1, label: '1 Minute', minutes: 1 };
    expect(createTimer(details, 0).id).not.toBe(createTimer(details, 0).id);
  });
});

describe('remainingSeconds and isExpired', () => {
  it('counts whole seconds up, so the last second shows 0:01', () => {
    expect(remainingSeconds(timer, 1_000_000 - 90_000)).toBe(90);
    expect(remainingSeconds(timer, 1_000_000 - 1)).toBe(1);
  });

  it('is 0 and expired from the end on, also long after', () => {
    expect(remainingSeconds(timer, 1_000_000)).toBe(0);
    expect(remainingSeconds(timer, 2_000_000)).toBe(0);
    expect(isExpired(timer, 999_999)).toBe(false);
    expect(isExpired(timer, 1_000_000)).toBe(true);
  });
});

describe('formatRemaining', () => {
  it('writes m:ss, and h:mm:ss from one hour on', () => {
    expect(formatRemaining(0)).toBe('0:00');
    expect(formatRemaining(9)).toBe('0:09');
    expect(formatRemaining(90)).toBe('1:30');
    expect(formatRemaining(25 * 60)).toBe('25:00');
    expect(formatRemaining(3725)).toBe('1:02:05');
  });
});

describe('parseTimers', () => {
  it('reads what was stored', () => {
    expect(parseTimers(JSON.stringify([timer]))).toEqual([timer]);
  });

  it('gives nothing for missing, broken or foreign data', () => {
    expect(parseTimers(null)).toEqual([]);
    expect(parseTimers('{not json')).toEqual([]);
    expect(parseTimers('{"id":"a"}')).toEqual([]);
  });

  it('drops malformed entries and keeps the good ones', () => {
    const broken = { ...timer, endsAt: 'soon' };
    expect(parseTimers(JSON.stringify([broken, timer, null, 5]))).toEqual([timer]);
  });
});
