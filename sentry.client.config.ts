// Sentry in the browser: errors, page-load performance, and a replay of the moments before an
// error (docs/decisions/0009-error-monitoring.md). The @sentry/astro integration adds this file to
// every page, but only when SENTRY_DSN is set at build time (astro.config.mjs).

import * as Sentry from '@sentry/astro';
import { SENTRY_DSN, VERCEL_ENV } from 'astro:env/client';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: VERCEL_ENV,
  // The SDK collects a lot by default. Off: cookies, headers and the bodies of our requests
  // (recipe forms, photos).
  dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [] },
  // Page loads and Web Vitals (@sentry/astro adds browser tracing by default)
  tracesSampleRate: 1.0,
  // A replay is kept only when an error happens, so normal browsing uses none of the quota
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

// Replay is large, so it's loaded after the page, as a chunk from our own domain (not Sentry's CDN).
import('@sentry/replay').then(({ replayIntegration }) => {
  Sentry.addIntegration(
    // Form inputs (the password above all) stay masked; recipe text and photos aren't sensitive
    replayIntegration({ maskAllInputs: true, maskAllText: false, blockAllMedia: false }),
  );
});
