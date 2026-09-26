# 00 – Vision

## Goal

One pleasant place for our own recipes: quick to find while shopping or planning, easy to read while cooking, easy to edit when a recipe changes.

## Users

Exactly two people (Martin and his wife), sharing one password. Used mainly on a phone in the kitchen, occasionally on a desktop.

## Principles

- **Airtable stays the source of truth.** The app is a better front end for it, not a replacement.
- **Small and cheap.** Must run on the free tiers of Vercel and Airtable.
- **Fix it when it hurts.** No speculative infrastructure (caching, conflict handling, i18n) until a real problem shows up.
- **Design-led UI.** Look, feel and screens come from Claude Design.

## Non-goals

- Public sign-up, user accounts, roles, multi-tenancy
- Multiple languages (German only)
- Offline mode or native apps (may be reconsidered later)
- Social features (sharing, comments, ratings by others)
