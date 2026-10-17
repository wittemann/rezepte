// Sentry on the server: errors, request performance (including the Airtable calls) and logs
// (docs/decisions/0009-error-monitoring.md). The @sentry/astro integration loads this file, but
// only when SENTRY_DSN is set at build time (astro.config.mjs).
// @sentry/node, not @sentry/astro: the latter's main entry also loads the build integration
// (Vite plugin, Sentry CLI), which slows every cold start. Astro's init only adds SDK metadata
// and drops spans of prerendered pages, and we have none.

import * as Sentry from '@sentry/node';
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
