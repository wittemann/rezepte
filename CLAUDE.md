# rezepte

Private recipe app for family and friends (one shared password). German UI; code, identifiers and docs in English.

Be extremely concise. Sacrifice grammar for the sake of concision.

- **Stack:** Astro (latest) SSR on Vercel free tier, Airtable as the source of truth (read + write).
- **Auth:** one shared password, checked against a hash held in environment variables. **Never commit secrets.**
- **Design:** comes from Claude Design, handoff in `design/` (start with `design/README.md`, variant `playful` only). Don't invent visual design; follow `docs/specs/05-design-integration.md`.
- **Specs:** `docs/specs/`. **Decisions (ADRs):** `docs/decisions/`. Index: `docs/README.md`.

**Writing recipes to Airtable directly** (outside the app): follow the "Data conventions" in `docs/specs/03-data-model.md`. The app reads the same records and skips ones it can't parse.

## Manual review before every commit

A human developer reviews every change before it's committed. Changes must be small and clear enough for a human to understand in one sitting.

- **Small steps:** one item from `docs/implementation-plan.md` (or a small group of related ones) per commit. Split larger work into several reviewable commits.
- **Before committing, stop and present the change:** what changed and why, the files touched, test/check results, and anything that deserves a close look (tricky logic, new dependencies, security-relevant code, generated files like `package-lock.json`). Point the reviewer to the diff.
- **Commit only after the reviewer's explicit OK** for that change. An OK covers that one commit, not later ones. Push only when asked.
- **Conventional Commits:** `type(scope): subject` (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`), imperative, lowercase subject, scope optional. The body explains why.
- **Readable code over clever code:** plain names, short functions, comments only where the reason isn't obvious. No unrelated refactors or drive-by changes mixed into a commit.
- **`type`, not `interface`:** enforced by ESLint. Extend with intersections (`A & { … }`).
- **Return types:** let TypeScript infer. Write one only when it gives a measurable benefit: a public type that must stay narrower or wider than the body, a type predicate, recursion, overloads, or a literal union that would widen. Not for consistency.
- **Recipe data never goes into the repo** (it's public): no exports, texts or even lists of recipe names.

## Decisions and libraries

Before building on a `Proposed` or `Open` decision, check its status in `docs/README.md`. When a decision changes, update the ADR and the index table.
Before relying on a library API, verify it against the current docs; versions move fast.
