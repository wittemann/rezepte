# 01 – Requirements

## Functional

> **TODO (design):** v1 scope gets decided once the Claude Design output is ready. The list below holds the candidates; move items to "v1" or "later" then.

### Baseline (needed regardless of design)

- Log in with the shared password, stay logged in on the device, log out
- List all recipes
- View a single recipe (ingredients, steps, images, metadata)
- Create, edit and delete a recipe; changes are written to Airtable
- Upload and replace recipe images, including straight from the phone camera (ADR 0005)

### Candidates

- Search (title, ingredients) and filter by tags or categories
- Serving scaler (needs structured ingredients, see [03-data-model](03-data-model.md))
- Cooking mode: large text, step by step, screen stays awake (Wake Lock API)
- Shopping list collected from several recipes
- Favorites / "cook again soon"

## Non-functional

- **Mobile-first**, usable with one hand in the kitchen; desktop works too
- **Fast enough on mobile:** a page shows within about 1 s on 4G. Airtable latency is the main factor.
- **Free tier only:** Vercel Hobby and Airtable's free plan
- **Security:** everything behind login; no secrets in the repo (see [04-auth](04-auth.md), [06-deployment](06-deployment.md))
- **Accessibility:** semantic HTML, sufficient contrast, usable by keyboard

## Settled product decisions

- **UI language: German only.** No i18n framework; German strings live directly in the components. Code, identifiers and docs are in English.
- **Ingredient structure** (free text vs. amount/unit/name) comes from the design. See [03-data-model](03-data-model.md).
- **Concurrent edits:** not a concern. Last write wins, no locking or conflict detection.
