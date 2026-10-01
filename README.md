# rezepte

Private recipe app for two. Astro SSR on Vercel, Airtable as the source of truth. Docs, specs and decisions: [docs/README.md](docs/README.md).

## Setup

```bash
nvm use            # Node 24, see .nvmrc
npm install
cp .env.example .env   # fill in, never commit (docs/specs/06-deployment.md)
npm run dev
```

## Scripts

| Script                            | What it does                            |
| --------------------------------- | --------------------------------------- |
| `npm run dev`                     | Dev server at http://localhost:4321     |
| `npm run build`                   | Production build (Vercel output)        |
| `npm run check`                   | Type check (`astro check`)              |
| `npm run lint`                    | ESLint                                  |
| `npm run format` / `format:check` | Prettier                                |
| `npm test` / `test:watch`         | Vitest                                  |
| `npm run test:e2e`                | Playwright (needs `AIRTABLE_E2E_TOKEN`) |

CI runs format check, lint, type check, tests, build, e2e tests and a gitleaks secret scan on every PR and push to `main`.
