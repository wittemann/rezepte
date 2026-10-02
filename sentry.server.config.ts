// Sentry on the server: errors, request performance (including the Airtable calls) and logs
// (docs/decisions/0009-error-monitoring.md). The @sentry/astro integration loads this file, but
// only when SENTRY_DSN is set at build time (astro.config.mjs).

import * as Sentry from '@sentry/astro';
import { SENTRY_DSN, VERCEL_ENV } from 'astro:env/client';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: VERCEL_ENV,
  // The SDK collects a lot by default. Off: the session cookie, headers, request bodies (login
  // password, recipe forms) and local variables in stack frames (could hold the password).
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    stackFrameVariables: false,
  },
  tracesSampleRate: 1.0,
  // No tracing headers on outgoing requests: they would all go to Airtable
  tracePropagationTargets: [],
  // Vercel Hobby keeps runtime logs for one hour; warnings and errors also go to Sentry Logs
  integrations: [Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] })],
});
