import { describe, expect, it } from 'vitest';
import {
  greetingFor,
  localTime,
  localDay,
  maxTotalMinutes,
  parseDiceSeed,
  parseStartQuery,
  startHref,
} from './start-query.ts';

// Berlin is UTC+2 in summer, UTC+1 in winter
const fridayMorning = new Date('2026-10-02T06:30:00Z'); // 08:30 in Berlin
const fridayEvening = new Date('2026-10-02T17:00:00Z'); // 19:00
const saturdayNoon = new Date('2026-10-03T10:00:00Z'); // 12:00
const none = new URLSearchParams();

describe('localTime', () => {
  it('uses the clock in Germany, not UTC', () => {
    expect(localTime(new Date('2026-10-02T22:30:00Z'))).toEqual({
      hour: 0,
      isWeekend: true,
    });
  });

  it('follows winter time', () => {
    expect(localTime(new Date('2026-12-01T22:30:00Z')).hour).toBe(23);
  });
});

describe('parseStartQuery', () => {
  it('defaults to Frühstück and little time on a weekday morning', () => {
    expect(parseStartQuery(none, fridayMorning)).toEqual({ meal: 'Frühstück', time: 'little' });
  });

  it('defaults to Abend from 11 o’clock', () => {
    const elevenInBerlin = new Date('2026-10-02T09:00:00Z');
    expect(parseStartQuery(none, elevenInBerlin).meal).toBe('Mittag & Abend');
    expect(parseStartQuery(none, fridayEvening).meal).toBe('Mittag & Abend');
  });

  it('defaults to much time on the weekend', () => {
    expect(parseStartQuery(none, saturdayNoon).time).toBe('much');
  });

  it('takes meal and time from the URL', () => {
    const params = new URLSearchParams('meal=baking&time=much');
    expect(parseStartQuery(params, fridayMorning)).toEqual({ meal: 'Backen', time: 'much' });
  });

  it('ignores unknown values', () => {
    const params = new URLSearchParams('meal=pizza&time=forever');
    expect(parseStartQuery(params, fridayMorning)).toEqual({ meal: 'Frühstück', time: 'little' });
  });
});

describe('startHref', () => {
  it('writes both values, so the link survives a change of the day', () => {
    expect(startHref({ meal: 'Mittag & Abend', time: 'little' })).toBe(
      '/?meal=lunch-dinner&time=little',
    );
  });
});

describe('startHref with dice', () => {
  it('adds the dice seed only when it is above 0', () => {
    const state = { meal: 'Backen', time: 'much' } as const;
    expect(startHref(state, 2)).toBe('/?meal=baking&time=much&dice=2');
    expect(startHref(state, 0)).toBe('/?meal=baking&time=much');
  });
});

describe('parseDiceSeed', () => {
  it.each([
    ['', 0],
    ['dice=3', 3],
    ['dice=-1', 0],
    ['dice=1.5', 0],
    ['dice=abc', 0],
    ['dice=99999', 0],
  ])('reads "%s" as %i', (query, expected) => {
    expect(parseDiceSeed(new URLSearchParams(query))).toBe(expected);
  });
});

describe('localDay', () => {
  it('is the date in Germany, also shortly after midnight there', () => {
    expect(localDay(new Date('2026-10-02T22:30:00Z'))).toBe('2026-10-03');
    expect(localDay(fridayMorning)).toBe('2026-10-02');
  });
});

describe('maxTotalMinutes', () => {
  it('has no limit for much time', () => {
    expect(maxTotalMinutes({ meal: 'Backen', time: 'much' })).toBeUndefined();
  });

  it('is 30 minutes for little time, 90 for baking', () => {
    expect(maxTotalMinutes({ meal: 'Frühstück', time: 'little' })).toBe(30);
    expect(maxTotalMinutes({ meal: 'Backen', time: 'little' })).toBe(90);
  });
});

describe('greetingFor', () => {
  it('changes at 11 and 18 o’clock', () => {
    expect(greetingFor(fridayMorning)).toBe('morning');
    expect(greetingFor(new Date('2026-10-02T09:00:00Z'))).toBe('day');
    expect(greetingFor(new Date('2026-10-02T15:59:00Z'))).toBe('day');
    expect(greetingFor(fridayEvening)).toBe('evening');
  });
});
