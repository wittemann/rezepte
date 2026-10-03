# 06 – Deployment

## Setup

- Public GitHub repo ([ADR 0008](../decisions/0008-tooling.md)) → Vercel project (Git integration, Hobby / free tier)
- Keep Vercel's **Git fork protection** on, so PRs from forks never build with our env vars without approval
- `main` branch → production; every other branch or PR → preview deployment
- Node version: current Active LTS supported by Vercel (see [ADR 0008](../decisions/0008-tooling.md))
- Vercel project `rezepte` in the personal Hobby account (`martin-wittemanns-projects`); function region `iad1` (US East, close to Airtable)
- **Production URL:** https://rezepte-rust.vercel.app (`rezepte.vercel.app` belongs to someone else, hence the random suffix). Moves to a custom domain later, see [ADR 0011](../decisions/0011-custom-domain.md)

## Deployment protection

- Vercel Authentication is on for everything **except the production domain**: preview and per-deployment URLs require a Vercel login (they use real Airtable data)
- The production domain is publicly reachable on purpose, so both of us can use it without a Vercel account. The app's own login ([04-auth](04-auth.md)) protects it
- A custom domain added later is also public (setting `all_except_custom_domains`)

## Environment variables

| Name                           | Content                                                                                                         | Where                           |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `APP_PASSWORD_HASH`            | scrypt hash of the shared password (`npm run hash-password`)                                                    | Vercel (prod + preview), `.env` |
| `SESSION_SECRET`               | random, 32+ bytes (`openssl rand -base64 32`)                                                                   | Vercel (prod + preview), `.env` |
| `AIRTABLE_TOKEN`               | Personal Access Token, scoped to this base only: `data.records:read`, `data.records:write`, `schema.bases:read` | Vercel (prod + preview), `.env` |
| `AIRTABLE_BASE_ID`             | `app…`                                                                                                          | Vercel (prod + preview), `.env` |
| `AIRTABLE_E2E_TOKEN`           | read-only token for the e2e tests: `data.records:read` only, this base only                                     | `.env`, GitHub Actions secret   |
| `SENTRY_DSN`                   | Sentry project key (public by design), read at build time; if unset, Sentry is off and not bundled              | Vercel (prod + preview)         |
| `SENTRY_AUTH_TOKEN`            | **secret**, for the source-map upload at build time                                                             | Vercel only                     |
| `SENTRY_ORG`, `SENTRY_PROJECT` | for the source-map upload                                                                                       | Vercel only                     |

## Secret rules

- **No secret is ever committed.** `.env` is in `.gitignore` from the first commit; `.env.example` (names only, empty values) is committed.
- Secrets are declared in the `astro:env` schema (`astro.config.mjs`) as `server` + `secret`, so they can't end up in client bundles. They're validated when `astro:env/server` is first imported at runtime, not at build time: the build and CI need no secrets, and a missing secret shows up as a runtime error (reported to Sentry).
- Safety net: GitHub secret scanning + push protection (free for public repos; check both are on) and a `gitleaks` step in CI.
- Previews use the same Airtable base. Keep that in mind: edits in a preview change real data.

## Free-tier limits to watch

- **Airtable:** 5 requests/s per base and 1,000 API calls per workspace per month on the free plan; the in-memory cache of [ADR 0003](../decisions/0003-rendering-and-caching.md) keeps the app within it. 429 errors (reported to Sentry) are the trigger to revisit it.
- **Vercel Hobby:** function invocations, execution time and bandwidth limits. Not expected to matter for two users. Runtime logs are kept for only **1 hour**, which is why errors go to Sentry.
- **Sentry Developer plan:** 5,000 errors/month, 50 session replays/month, 5M spans/month, 5 GB logs/month, 30 days retention ([ADR 0009](../decisions/0009-error-monitoring.md)).
