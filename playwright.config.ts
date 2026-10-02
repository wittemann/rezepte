// End-to-end tests (docs/decisions/0010-e2e-tests-deferred.md): Chromium with a phone viewport
// against a local dev server and the real Airtable base. Tests only read.
import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import { hashPassword } from './src/lib/auth/password.ts';
import { TEST_PASSWORD, TEST_SESSION_SECRET } from './e2e/test-credentials.ts';

// Airtable access comes from the local `.env`; in CI it's already in the environment.
// Variables already set (like AIRTABLE_TOKEN below) win over `.env`.
if (existsSync('.env')) process.loadEnvFile('.env');

// A read-only token (`data.records:read` only), so a test can't write even by mistake. Never
// falls back to AIRTABLE_TOKEN, which can write.
const airtableToken = process.env.AIRTABLE_E2E_TOKEN;
if (!airtableToken)
  throw new Error('Set AIRTABLE_E2E_TOKEN, a read-only Airtable token (.env.example).');

// Not the dev server's default port, so a dev server you started yourself is never reused:
// it would expect the real password.
const PORT = 4399;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    ...devices['Pixel 7'],
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: false,
    env: {
      APP_PASSWORD_HASH: await hashPassword(TEST_PASSWORD),
      SESSION_SECRET: TEST_SESSION_SECRET,
      AIRTABLE_TOKEN: airtableToken,
      E2E: '1',
    },
  },
});
