// Builds the `.ics` text for "add this recipe to the calendar" (ADR 0013): one all-day event.
// Format rules: RFC 5545, section 3.1 (lines, folding) and 3.3.11 (text escaping).

export type CalendarEventInput = {
  title: string;
  recipeUrl: string;
  /** Day of the event, `YYYY-MM-DD`. Check with `isCalendarDate` first. */
  date: string;
  /** Goes into DTSTAMP; passed in so the function stays pure. */
  now: Date;
};

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_LINE_BYTES = 75;
const LINE_BREAK = '\r\n';

/** True for real calendar dates in `YYYY-MM-DD` ("2026-02-30" and "2026-13-01" are not). */
export function isCalendarDate(value: string) {
  const match = CALENDAR_DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date rolls invalid days over (Feb 30 → Mar 2), so a changed day means the input was invalid.
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function buildCalendarEvent({ title, recipeUrl, date, now }: CalendarEventInput) {
  const url = new URL(recipeUrl);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//rezepte//Wochenmenue//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    // Unique per recipe and day, e.g. 2026-10-19-recipes-rec123@example.test
    `UID:${date}${url.pathname.replaceAll('/', '-')}@${url.host}`,
    `DTSTAMP:${formatUtcTimestamp(now)}`,
    `DTSTART;VALUE=DATE:${date.replaceAll('-', '')}`,
    `DTEND;VALUE=DATE:${nextDay(date).replaceAll('-', '')}`,
    `SUMMARY:${escapeText(title)}`,
    `URL:${recipeUrl}`,
    // Also as text, for calendar apps that don't show the URL property
    `DESCRIPTION:${escapeText(recipeUrl)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join(LINE_BREAK) + LINE_BREAK;
}

// UTC arithmetic, so the local time zone can't shift the day.
function nextDay(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

// 2026-10-18T09:05:03.123Z → 20261018T090503Z
function formatUtcTimestamp(date: Date) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

function escapeText(text: string) {
  return text
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

// Lines are limited to 75 octets (bytes, not characters). A continuation line starts with one space,
// which counts towards its limit. Splits between code points, never inside a multi-byte character.
function foldLine(line: string) {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let part = '';
  let partBytes = 0;
  for (const character of line) {
    const characterBytes = encoder.encode(character).length;
    const limit = parts.length === 0 ? MAX_LINE_BYTES : MAX_LINE_BYTES - 1;
    if (partBytes + characterBytes > limit) {
      parts.push(part);
      part = '';
      partBytes = 0;
    }
    part += character;
    partBytes += characterBytes;
  }
  parts.push(part);
  return parts.join(LINE_BREAK + ' ');
}
