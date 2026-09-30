# 0010 – End-to-end tests: deferred, then planned

**Status:** Accepted (2026-09-26); updated 2026-09-30: build them alongside the screens, against the real base, read-only

## Context

[ADR 0008](0008-tooling.md) originally planned one Playwright smoke test (login → list → detail). Before the design arrives there are no real screens to test, and the unit tests for `lib/` cover the riskiest logic (Airtable mapping, auth). Following "fix it when it hurts" ([00-vision](../specs/00-vision.md)), browser tests aren't worth their setup and upkeep yet.

## Decision

- **No end-to-end tests until the screens exist.** Vitest covers `lib/`
- **Update 2026-09-30:** screens are being built, so e2e tests are now in the [implementation plan](../implementation-plan.md). For now they run against the real Airtable base, **read-only**; no recipe data in the tests. Tests that write (edit, new) wait for a test base or a cleanup step
- **When they're added**, the plan is:
  - Playwright, one smoke test first: login → list → detail
  - Runs against a local dev server with a test `.env`, **never against production data**
  - Airtable: originally a separate test base or mocked responses. Previews and prod share the real base (06-deployment), so tests must not write there
  - Runs in the CI workflow from ADR 0008

## Consequences

- Less setup and a faster CI now
- A broken page (as opposed to broken `lib/` logic) is only noticed by using the app or through Sentry

## Revisit when

- The design screens are built and v1 is usable, or
- A bug reaches production that a smoke test would have caught
