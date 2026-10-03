# 02 – Architecture

## Overview

```
Browser (phone/desktop)
   │  HTTPS, session cookie
   ▼
Vercel ── Astro SSR (Node serverless functions)
   │   ├─ middleware: auth check (ADR 0004)
   │   ├─ pages/  → render HTML
   │   ├─ actions → create/update/delete (ADR 0006)
   │   └─ lib/recipes (repository) → lib/airtable (HTTP client)
   │                                        │  PAT from environment variables
   ▼                                        ▼
                                   Airtable REST API (source of truth)
```

Errors from browser, SSR and middleware go to Sentry ([0009](../decisions/0009-error-monitoring.md)).

Decisions: [0001](../decisions/0001-astro-on-vercel.md) (Astro/Vercel), [0002](../decisions/0002-airtable-as-source-of-truth.md) (Airtable), [0003](../decisions/0003-rendering-and-caching.md) (caching).

## Layers (planned structure)

```
src/
  middleware.ts          # auth gate
  pages/                 # routes, German UI
  actions/               # server mutations (Astro Actions)
  components/            # UI components built from the design
  styles/                # design tokens (CSS custom properties) + globals
  lib/
    airtable/            # thin fetch client: auth header, pagination, error mapping
    recipes/             # repository: getAll, getById, create, update, delete → domain types
    auth/                # hash verify, cookie sign/verify
  env / astro.config     # astro:env schema for secrets
```

Rule: only `lib/recipes` knows Airtable field names. Pages and components work with domain types from [03-data-model](03-data-model.md).

## Request flows

**Read (list/detail)**

1. Middleware checks the session cookie → redirect to `/login` if it's missing or invalid
2. The page calls `recipes.getAll()` / `recipes.getById(id)`
3. The repository reads its in-memory copy of the recipe table, loading it from Airtable when it is older than 15 minutes (one paginated call, not one call per recipe), and validates with zod
4. The page renders HTML (ADR 0003)

**Write (create/edit/delete)**

1. A form posts to an Astro Action (works without JS; enhanced with JS)
2. The action validates the input with zod and calls the repository → Airtable `POST`/`PATCH`/`DELETE`
3. The write clears the in-memory copy; redirect to the detail page (or the list after a delete), which loads the table fresh

**Images** ([ADR 0005](../decisions/0005-image-handling.md))

- Display: pages embed `/img/[recordId]/[attachmentId]`, never Airtable URLs. The route fetches a fresh Airtable URL, streams the image, and the Vercel CDN caches it long-term (attachment ids are immutable)
- Upload: an island resizes the photo in the browser, then an Astro Action sends it to Airtable's upload-attachment endpoint (max 5 MB)
