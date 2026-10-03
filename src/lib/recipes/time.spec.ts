import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  formatDurationInput,
  formatDurationShort,
  minutesToSeconds,
  parseDurationInput,
  secondsToMinutes,
} from './time.ts';

describe('secondsToMinutes and minutesToSeconds', () => {
  it('converts Airtable seconds to minutes and back', () => {
    expect(secondsToMinutes(1200)).toBe(20);
    expect(secondsToMinutes(3900)).toBe(65);
    expect(minutesToSeconds(20)).toBe(1200);
    expect(minutesToSeconds(65)).toBe(3900);
  });
});

describe('formatDuration', () => {
  it.each([
    [20, '20 Min.'],
    [0, '0 Min.'],
    [60, '1 Std.'],
    [65, '1 Std. 5 Min.'],
    [150, '2 Std. 30 Min.'],
  ])('formats %s minutes as "%s"', (minutes, text) => {
    expect(formatDuration(minutes)).toBe(text);
  });
});

describe('formatDurationShort', () => {
  it.each([
    [20, '20′'],
    [60, '1h'],
    [65, '1h05'],
    [150, '2h30'],
  ])('formats %s minutes as "%s"', (minutes, text) => {
    expect(formatDurationShort(minutes)).toBe(text);
  });
});

describe('formatDurationInput', () => {
  it.each([
    [20, '0:20'],
    [65, '1:05'],
    [720, '12:00'],
  ])('formats %s minutes as "%s"', (minutes, text) => {
    expect(formatDurationInput(minutes)).toBe(text);
  });

  it('gives an empty input for no time', () => {
    expect(formatDurationInput(undefined)).toBe('');
  });
});

describe('parseDurationInput', () => {
  it.each([
    ['0:20', 20],
    ['1:05', 65],
    ['12:00', 720],
    [' 1:30 ', 90],
  ])('reads "%s" as %s minutes', (text, minutes) => {
    expect(parseDurationInput(text)).toEqual({ valid: true, minutes });
  });

  it('reads an empty input as no time', () => {
    expect(parseDurationInput('')).toEqual({ valid: true });
    expect(parseDurationInput('  ')).toEqual({ valid: true });
  });

  it.each(['20', '90', '1:5', '1:75', '1:', ':30', '1,5', '1.30', '20 Min.', '-0:20', 'abc'])(
    'rejects "%s"',
    (text) => {
      expect(parseDurationInput(text)).toEqual({ valid: false });
    },
  );

  it('round-trips with formatDurationInput', () => {
    expect(parseDurationInput(formatDurationInput(65))).toEqual({ valid: true, minutes: 65 });
  });
});
