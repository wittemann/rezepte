// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import preact from '@astrojs/preact';
import vercel from '@astrojs/vercel';
import sentry from '@sentry/astro';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [
    // Islands only (docs/decisions/0006-forms-and-interactivity.md)
    preact(),
    // Runtime options are in sentry.client.config.ts and sentry.server.config.ts.
    // Off without a DSN (local dev, CI): then no Sentry code is bundled at all.
    // The source-map upload reads SENTRY_ORG, SENTRY_PROJECT and SENTRY_AUTH_TOKEN.
    sentry({
      enabled: Boolean(process.env.SENTRY_DSN),
      sourcemaps: { filesToDeleteAfterUpload: ['{.vercel,dist}/**/*.map'] },
      // Leaves out SDK code we don't use, so the bundle loaded on every page is smaller
      bundleSizeOptimizations: {
        excludeDebugStatements: true,
        excludeReplayIframe: true,
        excludeReplayShadowDom: true,
      },
      telemetry: false,
    }),
  ],
  // Off in e2e runs (playwright.config.ts): it sits over the bottom controls and takes their clicks
  devToolbar: { enabled: !process.env.E2E },
  // Downloaded from Fontsource at build time and served from our own domain, so visitors'
  // browsers never contact a font CDN (docs/decisions/0007-styling-approach.md).
  // Both are variable fonts: a weight range gives one file per font.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Fredoka',
      cssVariable: '--font-display',
      weights: ['500 600'],
      styles: ['normal'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Nunito',
      cssVariable: '--font-body',
      weights: ['400 800'],
      styles: ['normal'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
  env: {
    // Secrets are validated when `astro:env/server` is first imported, not at build time.
    // Values live in Vercel and the local `.env` only (docs/specs/06-deployment.md).
    schema: {
      APP_PASSWORD_HASH: envField.string({ context: 'server', access: 'secret' }),
      SESSION_SECRET: envField.string({ context: 'server', access: 'secret', min: 32 }),
      AIRTABLE_TOKEN: envField.string({ context: 'server', access: 'secret' }),
      AIRTABLE_BASE_ID: envField.string({ context: 'server', access: 'secret', startsWith: 'app' }),
      // Public by design: the browser needs it to send errors (docs/decisions/0009-error-monitoring.md)
      SENTRY_DSN: envField.string({ context: 'client', access: 'public', optional: true }),
      // Set by Vercel; separates production from preview errors in Sentry
      VERCEL_ENV: envField.enum({
        context: 'client',
        access: 'public',
        values: ['production', 'preview', 'development'],
        optional: true,
      }),
    },
  },
});
