// Time helpers for "Arbeitszeit" and "Gesamtzeit": Airtable seconds ⇄ minutes, display texts and
// the `h:mm` form input. Rules: design/README.md, "Regeln & Logik" and "7."; mapping:
// docs/specs/03-data-model.md, "Airtable mapping".

/** Result of reading the form input: minutes, no time (empty input), or not understood. */
export type DurationInput = { valid: true; minutes?: number } | { valid: false };

// "1:05", "0:20", "12:00": hours, colon, two-digit minutes.
const HOURS_AND_MINUTES = /^(\d+):(\d{2})$/;

/** Airtable duration (seconds) → minutes. The `h:mm` fields only hold whole minutes. */
export function secondsToMinutes(seconds: number) {
  return seconds / 60;
}

/** Minutes → Airtable duration (seconds), for writing back. */
export function minutesToSeconds(minutes: number) {
  return minutes * 60;
}

/** Long form for detail and list: 20 → "20 Min.", 60 → "1 Std.", 65 → "1 Std. 5 Min.". */
export function formatDuration(minutes: number) {
  const { hours, restMinutes } = splitHours(minutes);
  if (hours === 0) return `${restMinutes} Min.`;
  if (restMinutes === 0) return `${hours} Std.`;
  return `${hours} Std. ${restMinutes} Min.`;
}

/** Short form for the time pill on suggestion cards: 20 → "20′", 60 → "1h", 65 → "1h05". */
export function formatDurationShort(minutes: number) {
  const { hours, restMinutes } = splitHours(minutes);
  if (hours === 0) return `${restMinutes}′`;
  if (restMinutes === 0) return `${hours}h`;
  return `${hours}h${padMinutes(restMinutes)}`;
}

/** Value for the form's `h:mm` input: 65 → "1:05", 20 → "0:20", no time → "". */
export function formatDurationInput(minutes: number | undefined) {
  if (minutes === undefined) return '';
  const { hours, restMinutes } = splitHours(minutes);
  return `${hours}:${padMinutes(restMinutes)}`;
}

/**
 * Reads the form input back: only `h:mm` ("1:05", "0:20"), as in the design. Empty means no
 * time. Anything else is invalid, including a bare number ("20") and minutes ≥ 60 ("1:75").
 */
export function parseDurationInput(text: string) {
  const trimmed = text.trim();
  if (trimmed === '') return { valid: true as const };

  const match = HOURS_AND_MINUTES.exec(trimmed);
  if (!match) return { valid: false };
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (minutes >= 60) return { valid: false };
  return { valid: true as const, minutes: hours * 60 + minutes };
}

function splitHours(minutes: number) {
  return { hours: Math.floor(minutes / 60), restMinutes: minutes % 60 };
}

function padMinutes(minutes: number) {
  return String(minutes).padStart(2, '0');
}
