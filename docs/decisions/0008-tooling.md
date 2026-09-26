# 0008 – Tooling

**Status:** Accepted (2026-09-26)

## Decision

- **Language:** TypeScript, Astro's `strict` preset
- **Package manager:** npm (already in use)
- **Node:** the current Active LTS supported by Vercel (Node 24), pinned via `engines` + `.nvmrc`
- **Format / lint:** Prettier (+ `prettier-plugin-astro`), ESLint (+ `eslint-plugin-astro`)
- **Tests:** Vitest for `lib/` (Airtable mapping, auth hash/cookie). Test files are named `*.spec.ts` and sit next to the code they test. End-to-end tests are deferred, see [ADR 0010](0010-e2e-tests-deferred.md)
- **Git / GitHub:** a **public** GitHub repo. Vercel Git integration gives preview deploys
- **CI:** a GitHub Action runs lint, type-check (`astro check`), tests and a secret scan (gitleaks) on **every PR and every push to `main`**
- **Secret scanning:** GitHub secret scanning and push protection (free for public repos; check both are on in the repo settings) plus the gitleaks step in CI
- **Dependencies:** Dependabot alerts and security-update PRs are on (only security fixes, no routine version bumps). Each PR runs CI. Known exception: `path-to-regexp` under `@astrojs/vercel` is only used at build time on our own routes; don't accept a fix that downgrades the adapter
- **Versions:** always the latest stable at scaffold time; check `npm view <pkg> version` instead of relying on memory
  - Exception: **TypeScript is pinned to `~6.0`** (2026-09-26). TypeScript 7 is out, but `@astrojs/check` (`^5 || ^6`) and `typescript-eslint` (`<6.1`) don't support it yet. Upgrade when both do

## Consequences

- A small, standard setup with no monorepo and no custom build tooling
- Direct pushes to `main` are checked too, not only PRs
- **Public repo:** the code and docs are visible to anyone; data and secrets are not (they live in Airtable and in env vars). Field IDs in `fields.ts` are not secret: they're useless without `AIRTABLE_TOKEN`
- **Public repo and forks:** CI needs no secrets, so fork PRs can run it safely. Vercel must not build fork PRs with our env vars; keep Vercel's fork protection on (see [06-deployment](../specs/06-deployment.md))
