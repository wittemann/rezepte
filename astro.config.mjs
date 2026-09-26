// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import preact from '@astrojs/preact';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  // Islands only (docs/decisions/0006-forms-and-interactivity.md)
  integrations: [preact()],
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
    },
  },
});
