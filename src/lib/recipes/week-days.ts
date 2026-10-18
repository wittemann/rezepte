// The days offered by "Wann gibt's das?" (ADR 0013): tomorrow up to a week from today, so each
// weekday appears once, Monday first. All in local time, because the phone's time zone decides
// what "today" is.

const WEEKDAY_NAMES = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
];

// Written out instead of Intl: its short German months differ between ICU versions ("Sept." vs "Sep.")
const MONTH_ABBREVIATIONS = [
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
];

export type WeekDay = {
  /** `YYYY-MM-DD`, the local date */
  date: string;
  /** "Montag" … "Sonntag" */
  name: string;
  /** For example "19. Okt." */
  shortDate: string;
};

const twoDigits = (value: number) => String(value).padStart(2, '0');

export function weekDays(today: Date) {
  const days = Array.from({ length: 7 }, (_, index) => {
    // Counting days on the calendar date, not in milliseconds: a day with a clock change isn't 24 hours
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index + 1);
    const month = day.getMonth();
    return {
      sortKey: (day.getDay() + 6) % 7, // Monday = 0
      date: `${day.getFullYear()}-${twoDigits(month + 1)}-${twoDigits(day.getDate())}`,
      name: WEEKDAY_NAMES[day.getDay()],
      shortDate: `${day.getDate()}. ${MONTH_ABBREVIATIONS[month]}`,
    };
  });
  return days
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ date, name, shortDate }) => ({ date, name, shortDate }));
}
