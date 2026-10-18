import { describe, expect, it } from 'vitest';
import { buildCalendarEvent, isCalendarDate } from './calendar-event.ts';

const now = new Date('2026-10-18T09:05:03.123Z');

function build(overrides: Partial<Parameters<typeof buildCalendarEvent>[0]> = {}) {
  return buildCalendarEvent({
    title: 'Testeintopf',
    recipeUrl: 'https://example.test/recipes/abc123',
    date: '2026-10-19',
    now,
    ...overrides,
  });
}

function unfold(ics: string) {
  return ics.replaceAll('\r\n ', '');
}

describe('buildCalendarEvent', () => {
  it('builds one all-day event with CRLF line endings', () => {
    expect(build()).toBe(
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//rezepte//Wochenmenue//DE',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:2026-10-19-recipes-abc123@example.test',
        'DTSTAMP:20261018T090503Z',
        'DTSTART;VALUE=DATE:20261019',
        'DTEND;VALUE=DATE:20261020',
        'SUMMARY:Testeintopf',
        'URL:https://example.test/recipes/abc123',
        'DESCRIPTION:https://example.test/recipes/abc123',
        'END:VEVENT',
        'END:VCALENDAR',
        '',
      ].join('\r\n'),
    );
  });

  it('has no bare line feeds', () => {
    expect(build({ title: 'Zeile\neins' }).replaceAll('\r\n', '')).not.toContain('\n');
  });

  it.each([
    ['2026-12-31', '20270101'],
    ['2026-01-31', '20260201'],
    ['2026-02-28', '20260301'],
    ['2028-02-28', '20280229'],
    ['2028-02-29', '20280301'],
  ])('ends %s on the next day %s', (date, end) => {
    expect(build({ date })).toContain(`DTEND;VALUE=DATE:${end}\r\n`);
  });

  it('escapes backslash, semicolon, comma and newline in the title', () => {
    expect(build({ title: 'a\\b;c,d\ne\r\nf' })).toContain('SUMMARY:a\\\\b\\;c\\,d\\ne\\nf\r\n');
  });

  it('escapes the URL in DESCRIPTION but not in URL', () => {
    const ics = build({ recipeUrl: 'https://example.test/r?a=1,2;3' });
    expect(ics).toContain('URL:https://example.test/r?a=1,2;3\r\n');
    expect(ics).toContain('DESCRIPTION:https://example.test/r?a=1\\,2\\;3\r\n');
  });

  it('folds lines to at most 75 bytes and unfolds back to the original', () => {
    const title = 'Sehr lange Überschrift mit Käse, Äpfeln und Möhren – '.repeat(5);
    const ics = build({ title });
    const encoder = new TextEncoder();
    const lines = ics.split('\r\n').slice(0, -1);
    for (const line of lines) expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    expect(lines.filter((line) => line.startsWith(' ')).length).toBeGreaterThan(0);
    expect(unfold(ics)).toContain(`SUMMARY:${title.replaceAll(',', '\\,')}\r\n`);
  });

  it('never splits a multi-byte character when folding', () => {
    // "SUMMARY:" is 8 bytes; 33 × "ä" (2 bytes) fill 66 → 74 bytes, the next "ä" would hit 76.
    const ics = build({ title: 'ä'.repeat(40) });
    const summaryLines = ics
      .split('\r\n')
      .filter((line) => line.startsWith('SUMMARY:') || line.startsWith(' '));
    expect(summaryLines[0]).toBe(`SUMMARY:${'ä'.repeat(33)}`);
    expect(summaryLines[1]).toBe(` ${'ä'.repeat(7)}`);
    expect(unfold(ics)).toContain(`SUMMARY:${'ä'.repeat(40)}\r\n`);
  });

  it('keeps 4-byte characters whole', () => {
    const title = '🍝'.repeat(30);
    expect(unfold(build({ title }))).toContain(`SUMMARY:${title}\r\n`);
    expect(build({ title })).not.toContain('\uFFFD');
  });
});

describe('isCalendarDate', () => {
  it.each(['2026-10-18', '2026-12-31', '2028-02-29', '2000-02-29'])('accepts %s', (value) => {
    expect(isCalendarDate(value)).toBe(true);
  });

  it.each([
    '2026-02-30',
    '2027-02-29',
    '1900-02-29',
    '2026-13-01',
    '2026-00-10',
    '2026-10-00',
    '2026-10-32',
    '2026-4-5',
    '20261018',
    '2026-10-18T00:00:00Z',
    ' 2026-10-18',
    '',
    'heute',
  ])('rejects "%s"', (value) => {
    expect(isCalendarDate(value)).toBe(false);
  });
});
