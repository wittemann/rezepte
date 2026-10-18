import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { weekDays } from './week-days.ts';

// Dates are built in local time, so the zone must be fixed for the clock-change test to mean anything
let originalZone: string | undefined;
beforeAll(() => {
  originalZone = process.env.TZ;
  process.env.TZ = 'Europe/Berlin';
});
afterAll(() => {
  if (originalZone === undefined) delete process.env.TZ;
  else process.env.TZ = originalZone;
});

const dates = (today: Date) => weekDays(today).map((day) => day.date);

describe('weekDays', () => {
  it('lists Montag to Sonntag, each as the next such weekday after today', () => {
    // Wednesday
    const days = weekDays(new Date(2026, 9, 14, 10, 0));
    expect(days.map((day) => day.name)).toEqual([
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
      'Sonntag',
    ]);
    expect(days.map((day) => day.date)).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21', // a week from today, not today
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ]);
  });

  it('on a Sunday gives exactly the coming week', () => {
    expect(dates(new Date(2026, 9, 18, 9, 0))).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ]);
  });

  it('never includes today', () => {
    // Monday
    expect(dates(new Date(2026, 9, 19))).not.toContain('2026-10-19');
    expect(dates(new Date(2026, 9, 19))[0]).toBe('2026-10-26');
  });

  it('formats the short date in German', () => {
    const days = weekDays(new Date(2026, 9, 18));
    expect(days[0].shortDate).toBe('19. Okt.');
    expect(days[6].shortDate).toBe('25. Okt.');
  });

  it('spells out every month', () => {
    const months = Array.from(
      { length: 12 },
      (_, month) => weekDays(new Date(2026, month, 14))[0].shortDate.split('. ')[1],
    );
    expect(months).toEqual([
      'Jan.',
      'Feb.',
      'März',
      'Apr.',
      'Mai',
      'Juni',
      'Juli',
      'Aug.',
      'Sept.',
      'Okt.',
      'Nov.',
      'Dez.',
    ]);
  });

  it('uses the local date late in the evening, not the UTC date', () => {
    // Saturday 31 Oct 00:30 in Berlin is still Friday 30 Oct in UTC
    expect(dates(new Date(2026, 9, 18, 23, 59))[0]).toBe('2026-10-19');
    expect(dates(new Date(2026, 9, 31, 0, 30))).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-01',
    ]);
  });

  it('crosses month and year ends', () => {
    // Thursday 31 Dec 2026
    expect(weekDays(new Date(2026, 11, 31, 22, 0))).toEqual([
      { date: '2027-01-04', name: 'Montag', shortDate: '4. Jan.' },
      { date: '2027-01-05', name: 'Dienstag', shortDate: '5. Jan.' },
      { date: '2027-01-06', name: 'Mittwoch', shortDate: '6. Jan.' },
      { date: '2027-01-07', name: 'Donnerstag', shortDate: '7. Jan.' },
      { date: '2027-01-01', name: 'Freitag', shortDate: '1. Jan.' },
      { date: '2027-01-02', name: 'Samstag', shortDate: '2. Jan.' },
      { date: '2027-01-03', name: 'Sonntag', shortDate: '3. Jan.' },
    ]);
  });

  it('handles 29 February', () => {
    // Sunday 27 Feb 2028, the next Monday is the 28th (2028 is a leap year)
    expect(dates(new Date(2028, 1, 27))).toEqual([
      '2028-02-28',
      '2028-02-29',
      '2028-03-01',
      '2028-03-02',
      '2028-03-03',
      '2028-03-04',
      '2028-03-05',
    ]);
  });

  it('is not thrown off by the clock changes', () => {
    // Sunday 25 Oct 2026 02:00 → 03:00 is repeated (autumn); Sunday 29 Mar 2026 02:00 is skipped (spring)
    expect(dates(new Date(2026, 9, 24, 23, 30))[0]).toBe('2026-10-26');
    expect(dates(new Date(2026, 9, 25, 0, 30))).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
    expect(dates(new Date(2026, 2, 28, 23, 30))[0]).toBe('2026-03-30');
    expect(dates(new Date(2026, 2, 29, 12, 0))).toEqual([
      '2026-03-30',
      '2026-03-31',
      '2026-04-01',
      '2026-04-02',
      '2026-04-03',
      '2026-04-04',
      '2026-04-05',
    ]);
  });
});
