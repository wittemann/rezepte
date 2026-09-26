# 00 – Vision

## Goal

One pleasant place for our own recipes: quick to find while shopping or planning, easy to read while cooking, easy to edit when a recipe changes.

## Users

Family and friends: a small, trusted group who all see **and edit** the same cookbook, sharing one password (decided 2026-09-26; originally just two people). Used mainly on an iPhone in the kitchen, added to the home screen; occasionally on a desktop.

## Principles

- **Airtable stays the source of truth.** The app is a better front end for it, not a replacement.
- **Small and cheap.** Must run on the free tiers of Vercel and Airtable.
- **Fix it when it hurts.** No speculative infrastructure (caching, conflict handling, i18n) until a real problem shows up.
- **Design-led UI.** Look, feel and screens come from Claude Design.

## Non-goals

- Public sign-up, user accounts, roles, multi-tenancy
- Multiple languages (German only)
- Offline mode or native apps (may be reconsidered later). The web app can be added to the home screen, but needs a connection ([ADR 0012](../decisions/0012-pwa-and-timers.md))
- Social features (sharing, comments, ratings by others)
