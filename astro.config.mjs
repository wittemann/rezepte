// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
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
