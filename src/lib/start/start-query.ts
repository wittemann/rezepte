// The start page's state lives in the URL (docs/decisions/0006-forms-and-interactivity.md):
//   /?meal=breakfast&time=little
// Without parameters the defaults depend on the time: before 11 → Frühstück, otherwise Abend;
// Monday to Friday → "Wenig Zeit", weekend → "Viel Zeit" (design/README.md, "Start").
// Parsing only accepts known values and ignores everything else.

import { MEALS, type Meal } from '../recipes/fields.ts';

export const START_PATH = '/';

/** "Wenig Zeit" limit; for baking it's longer */
export const LITTLE_TIME_MINUTES = 30;
export const LITTLE_TIME_BAKING_MINUTES = 90;

const MAX_DICE_SEED = 1000; // keeps a hand-made URL sane

const TIMES = ['little', 'much'] as const;
export type StartTime = (typeof TIMES)[number];

export type StartState = {
  meal: Meal;
  time: StartTime;
};

/** The app is for a family in Germany; the server runs in UTC, so the clock has to be converted. */
const TIME_ZONE = 'Europe/Berlin';

/** The date in Germany, e.g. "2026-10-02"; the daily picks change with it. */
export function localDay(now: Date) {
  // The Swedish locale writes dates as year-month-day
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TIME_ZONE }).format(now);
}

/** Hour and weekend flag on the wall clock in Germany. */
export function localTime(now: Date) {
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, ...options }).format(now);
  const weekday = format({ weekday: 'short' });
  return {
    hour: Number(format({ hour: 'numeric', hourCycle: 'h23' })),
    isWeekend: weekday === 'Sat' || weekday === 'Sun',
  };
}

/** Reads the start state from URL parameters; what's missing or invalid falls back to the defaults. */
export function parseStartQuery(params: URLSearchParams, now: Date) {
  const { hour, isWeekend } = localTime(now);
  const defaultMeal: Meal = hour < 11 ? 'Frühstück' : 'Mittag & Abend';
  const defaultTime: StartTime = isWeekend ? 'much' : 'little';
  return {
    meal: MEALS.find((entry) => entry.name === params.get('meal'))?.value ?? defaultMeal,
    time: TIMES.find((time) => time === params.get('time')) ?? defaultTime,
  };
}

/** "Nochmal würfeln" counter from the URL: a whole number from 0 up, otherwise 0. */
export function parseDiceSeed(params: URLSearchParams) {
  const seed = Number(params.get('dice'));
  return Number.isInteger(seed) && seed > 0 && seed <= MAX_DICE_SEED ? seed : 0;
}

/**
 * Link to the start page with this state. Always explicit, so a click keeps working after midnight.
 * Changing meal or time starts over with the first picks, so the dice seed is only set on request.
 */
export function startHref({ meal, time }: StartState, diceSeed = 0) {
  const mealName = MEALS.find((entry) => entry.value === meal)?.name;
  const params = new URLSearchParams();
  if (mealName) params.set('meal', mealName);
  params.set('time', time);
  if (diceSeed > 0) params.set('dice', String(diceSeed));
  return `${START_PATH}?${params}`;
}

/** Longest total time for the suggestions; undefined = no limit. */
export function maxTotalMinutes({ meal, time }: StartState) {
  if (time === 'much') return undefined;
  return meal === 'Backen' ? LITTLE_TIME_BAKING_MINUTES : LITTLE_TIME_MINUTES;
}

export type Greeting = 'morning' | 'day' | 'evening';

/** Morning until 11 (like the meal default), evening from 18. */
export function greetingFor(now: Date) {
  const { hour } = localTime(now);
  if (hour < 11) return 'morning';
  return hour < 18 ? 'day' : 'evening';
}
