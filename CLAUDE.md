# rezepte

Private recipe app for two people (Martin and his wife). German UI; code, identifiers and docs in English.

- **Stack:** Astro (latest) SSR on Vercel free tier, Airtable as the source of truth (read + write).
- **Auth:** one shared password, checked against a hash held in environment variables. **Never commit secrets.**
- **Design:** comes from Claude Design. Don't invent visual design; follow `docs/specs/05-design-integration.md`.
- **Specs:** `docs/specs/`. **Decisions (ADRs):** `docs/decisions/`. Index: `docs/README.md`.

**Writing recipes to Airtable directly** (outside the app): follow the "Data conventions" in `docs/specs/03-data-model.md`. The app reads the same records and skips ones it can't parse.

Before building on a `Proposed` or `Open` decision, check its status in `docs/README.md`. When a decision changes, update the ADR and the index table.
Before relying on a library API, verify it against the current docs; versions move fast.
