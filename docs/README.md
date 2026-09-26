# rezepte – Documentation

## Specs

| File                                                    | Content                                                               |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| [00-vision](specs/00-vision.md)                         | Goal, users, non-goals                                                |
| [01-requirements](specs/01-requirements.md)             | Functional and non-functional requirements, settled product decisions |
| [02-architecture](specs/02-architecture.md)             | System overview, layers, request flows                                |
| [03-data-model](specs/03-data-model.md)                 | Domain types and Airtable mapping                                     |
| [04-auth](specs/04-auth.md)                             | Shared-password login                                                 |
| [05-design-integration](specs/05-design-integration.md) | How the Claude Design output flows into the code                      |
| [06-deployment](specs/06-deployment.md)                 | Vercel, environment variables, secrets, limits                        |

## Decision log

Status: **Accepted** = settled · **Proposed** = recommended, awaiting OK · **Open** = blocked on input (design or Airtable schema)

| #                                                     | Decision                                                                                | Status          | Blocked on                         |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------- | ---------------------------------- |
| [0001](decisions/0001-astro-on-vercel.md)             | Astro (latest) SSR on Vercel                                                            | Accepted        | –                                  |
| [0002](decisions/0002-airtable-as-source-of-truth.md) | Airtable via own fetch client, field IDs, typecast, tolerant reads                      | Accepted        | –                                  |
| [0003](decisions/0003-rendering-and-caching.md)       | Plain SSR, no caching for now                                                           | Accepted        | –                                  |
| [0004](decisions/0004-shared-password-auth.md)        | Shared password, hash in env, signed cookie                                             | Accepted        | –                                  |
| [0005](decisions/0005-image-handling.md)              | Images: Airtable attachments behind a proxy, upload in the app                          | Accepted        | –                                  |
| [0006](decisions/0006-forms-and-interactivity.md)     | Astro Actions + small islands                                                           | Partly accepted | Island framework: design (edit UX) |
| [0007](decisions/0007-styling-approach.md)            | Styling follows the design export (CSS vars by default, Tailwind if the export uses it) | Partly accepted | Outcome: design export             |
| [0008](decisions/0008-tooling.md)                     | TypeScript, npm, Node LTS, lint, Vitest, public repo, CI on PR + main                   | Accepted        | –                                  |
| [0009](decisions/0009-error-monitoring.md)            | Error monitoring with Sentry (free plan, errors + replay on error)                      | Accepted        | –                                  |
| [0010](decisions/0010-e2e-tests-deferred.md)          | End-to-end tests (Playwright) deferred; plan for later documented                       | Accepted        | –                                  |

## ADR format

Each ADR has **Status**, **Context**, **Decision**, **Consequences**, and for non-accepted ones **To accept**: what's needed to move it to Accepted.
