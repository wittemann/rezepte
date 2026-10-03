# 0002 – Airtable as source of truth behind a repository layer

**Status:** Accepted

## Context

The recipes already live in Airtable, and it stays the source of truth. The app reads and writes. Besides the app, records are edited by hand in Airtable and **sometimes by Claude** (via an Airtable integration). Airtable's field names and record shapes shouldn't leak into the UI.

## Decision

**Access**

- Airtable is accessed **server-side only** with a Personal Access Token (`AIRTABLE_TOKEN`), scoped to this one base
- **No SDK.** The official `airtable` npm package (0.12.x) is stale (it depends on `node-fetch` v2 and `@types/node` <15) and doesn't cover the upload-attachment endpoint (ADR 0005). Instead: a thin `fetch` client

**Layers**

- `src/lib/airtable/client.ts`: base URL, auth header, pagination via `offset`, error mapping, **on 429 one retry after 30 s backoff** (Airtable's penalty window), then error
- `src/lib/recipes/fields.ts`: table and field IDs as readable constants, e.g. `F.title = 'fld…'`
- `src/lib/recipes/repository.ts`: `getAll`, `getById`, `create`, `update`, `remove`, `uploadImage`. It maps records ⇄ domain types and validates with zod
- Pages, actions and components only see domain types ([03-data-model](../specs/03-data-model.md))

**Field references: IDs, not names**

- Reads use `returnFieldsByFieldId=true`; writes send field IDs
- Renaming fields in Airtable never breaks the app
- `npm run airtable:schema` (metadata API, needs `schema.bases:read`) prints all tables and fields with their IDs, both to fill in `fields.ts` and to spot changes

**Writes**

- `typecast: true`: new tags or categories typed in the app are created as select options automatically
- `PATCH` (partial update) only, never `PUT`, so fields the app doesn't know about stay untouched
- The app never writes computed fields (formulas, lookups, created/modified time)

**Tolerant reading** (because people and Claude also write to the base)

- Optional in the schema: everything except title
- Invalid records are logged and skipped in lists. The detail page shows what it can plus a hint, instead of crashing
- The data conventions in [03-data-model](../specs/03-data-model.md) are the contract for **every** writer. Claude sessions that write to Airtable must follow them (see `CLAUDE.md`)

## Consequences

- Airtable stays usable as an admin UI in parallel; edits show up within 15 minutes (in-memory cache, ADR 0003)
- A future switch to a database or another service only touches `src/lib/`
- Debugging raw API responses shows field IDs, not names. `fields.ts` and the schema script translate
