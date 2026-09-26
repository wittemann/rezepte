# 0009 – Error monitoring with Sentry (free plan)

**Status:** Accepted

## Context

Vercel Hobby keeps runtime logs for only **1 hour**; longer retention is a paid add-on. An error noticed the next day would leave no trace. We also want to see Airtable problems (rate limits, records that fail validation, see ADR 0002/0003) without watching the logs.

## Decision

- **Sentry, free Developer plan** (as of 2026-09: 5,000 errors/month, 50 session replays/month, 1 user, 30 days retention). Create the account in the **EU data region**
- **SDK:** the official `@sentry/astro` integration (11.x supports Astro 7). It covers browser, SSR and middleware errors
- **Scope: errors + session replay on error.** Tracing is off (performance sample rate 0)
- **Session replay** (free plan: 50 replays/month; new accounts get 5,000/month for the first 3 months):
  - `replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 1.0`: a replay is kept **only when an error happens**, covering the moments leading up to it. Normal browsing uses none of the quota
  - Privacy: **all form inputs masked** (the password field above all). Recipe text stays unmasked, because it isn't sensitive and makes replays readable. Images are shown
  - The replay integration is lazy-loaded (`lazyLoadIntegration`) so it doesn't weigh down the first page load on mobile
  - Browser only; server errors have no replay
- **Source maps** are uploaded at build time so stack traces show real code, then deleted from the deployed output
- **Explicit reporting from the app:**
  - Airtable client errors (`lib/airtable`): include method, path and status as context; report 429 separately, since it's the trigger to revisit ADR 0003
  - Records skipped by validation (`lib/recipes`): warning level, tagged with the record id and failing fields. This mainly catches data written by hand or by Claude in unexpected formats
  - Failed image uploads (ADR 0005)
- **Privacy:** no PII to report beyond the shared-password setup; `sendDefaultPii: false`. The login password must never appear in breadcrumbs or request bodies (scrub `/login` POST data)
- **Alerts:** email on a new issue (Sentry default)

## Environment variables

| Name                           | Secret?                                  | Use                                       |
| ------------------------------ | ---------------------------------------- | ----------------------------------------- |
| `SENTRY_DSN`                   | no (public by design), still kept in env | SDK init, browser + server                |
| `SENTRY_AUTH_TOKEN`            | **yes**                                  | source-map upload during the Vercel build |
| `SENTRY_ORG`, `SENTRY_PROJECT` | no                                       | source-map upload                         |

Set only in Vercel and local `.env`, never committed (see [06-deployment](../specs/06-deployment.md)). Without `SENTRY_DSN` (for example in local dev) Sentry stays disabled.

## Consequences

- Errors stay visible for 30 days and trigger an email
- One more service account to manage. If Sentry's free plan disappears or shrinks, the reporting calls are in a few places (`lib/airtable`, `lib/recipes`, image upload), so a switch is small
- Revisit if the 5k/month error quota is ever hit; that would indicate a bug loop, not normal use
- The 50 replays/month can run out when one browser-side bug keeps repeating. Errors are still recorded, only without replays for the rest of the month. Acceptable
- Verify the option names (`replaysOnErrorSampleRate`, `lazyLoadIntegration`, masking options) against the current `@sentry/astro` docs at implementation time
