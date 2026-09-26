# 0001 – Astro (latest) SSR on Vercel

**Status:** Accepted

## Context

Hosting must be the Vercel free tier. The app reads and writes Airtable live, so it needs server-side code. Martin likes Astro.

## Decision

- The latest Astro (7.3.x as of 2026-09) with the official `@astrojs/vercel` adapter (11.0.x), scaffolded via `npm create astro@latest`
- `output: 'server'` (SSR). Purely static pages (such as the login page shell) may be prerendered
- Before using a specific Astro API (Actions, `astro:env`, middleware, adapter options), verify it against the current docs

## Consequences

- One codebase for UI and server logic. No separate backend
- Pages ship close to zero JS by default; interactivity comes through islands (ADR 0006)
- Every page view is a serverless function call. That's fine for two users on the Hobby tier
