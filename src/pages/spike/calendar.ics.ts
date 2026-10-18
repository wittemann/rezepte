// Temporary spike for ADR 0013: serves the test event from our own domain, behind the login.
import type { APIRoute } from 'astro';
import { SPIKE_EVENT_ICS } from './_calendar-event.ts';

export const GET: APIRoute = () =>
  new Response(SPIKE_EVENT_ICS, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="kochbuch-test.ics"',
    },
  });
