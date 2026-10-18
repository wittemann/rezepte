// Temporary spike for ADR 0013 (docs/decisions/0013-weekly-menu-calendar.md): one hard-coded
// all-day event. Delete src/pages/spike/ once the ADR is decided.
export const SPIKE_EVENT_ICS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//rezepte//spike//DE',
  'BEGIN:VEVENT',
  'UID:spike-20261026@rezepte',
  'DTSTAMP:20261018T120000Z',
  'DTSTART;VALUE=DATE:20261026',
  'DTEND;VALUE=DATE:20261027',
  'SUMMARY:Kochbuch-Test (löschen)',
  'END:VEVENT',
  'END:VCALENDAR',
  '',
].join('\r\n');
