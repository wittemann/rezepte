# 0003 – Plain SSR with a shared copy of the recipe table

**Status:** Accepted

## Context

Airtable's free plan allows **1,000 API calls per workspace per month** (resets on the 1st; after a 30-day grace period, calls over the limit are blocked) and 5 requests/s per base. We stay on the free plan. Reading live on every request cost at least one call per page view, one per image cache miss and two per write, so the monthly budget lasted days.

Airtable is also unpredictable: from Vercel, one page of the table (up to 100 records) usually takes about 170 ms, but the slowest 5 % take over 2 s and single requests up to 11 s (Sentry, October 2026). The table needs at least two pages in a row. The first version of this ADR kept the table in memory per server instance for 15 minutes. That saved calls, but every cold start (after a few minutes without use) and every expiry made a visitor wait for Airtable, which made the slowest 5 % of recipe pages take 2–9 s.

Recipes are also added directly in Airtable (e.g. through Claude), not only in the app.

## Decision

- Pages stay plain SSR. No CDN cache or ISR for pages (they are behind the login)
- The repository (`lib/recipes/repository.ts`) keeps **the whole recipe table** in two places:
  - in the **memory** of each server instance, as before
  - in the **Vercel Runtime Cache** (`getCache()` from `@vercel/functions`), shared by all instances of a region and kept across cold starts and deployments
- **Reads never wait for Airtable when there is a copy.** Memory first, then the Runtime Cache. Only without any copy (first use, or the Runtime Cache evicted it) does the request load the table from Airtable
- **Background refresh:** when the copy is older than **10 minutes**, the request still uses it and reloads the table after the response (`waitUntil`). Concurrent requests share one reload; a failed reload keeps the old copy
- **Writes update the copy:** Airtable answers a create or update with the saved record. The repository puts that record into the copy (memory and Runtime Cache) instead of throwing the copy away, so the change shows up at once, also on other phones, without reloading the table
- **Refresh button:** a button in the app reloads the table right away, for changes made directly in Airtable
- **Expired image links:** Airtable's attachment URLs in the records expire after about 2 hours, and the copy can be older. When the image proxy gets an error for an expired link, it fetches that one record fresh, updates it in the copy and tries again
- A 429 for the monthly quota fails right away; only a rate-limit 429 waits 30 s and retries

Rejected:

- **Airtable webhooks or automations** to refresh the copy on direct edits: webhooks expire after 7 days unless refreshed (costing calls), and automation runs are limited on the free plan. The refresh button covers the need
- **Moving to a database** (Supabase, Neon, MySQL on IONOS behind a PHP API): faster and without a call cap, but a migration, and Airtable would no longer be the place to edit recipes by hand
- **Keeping the server warm** with a regular ping: each warm instance would still reload the table every few minutes, about 3,000 calls a month

## Consequences

- Page views, including after a cold start, read the copy instead of waiting for Airtable. Only the very first load, or one after the Runtime Cache evicted the entry, waits for Airtable
- Airtable calls: at most one reload per 10 minutes while someone uses the app, one call per write, and a single call now and then for an expired image link. A week without use costs nothing
- Recipes added or changed directly in Airtable show up within about 10 minutes of use, or at once with the refresh button
- A page view right after the copy turned 10 minutes old still shows the old data; the next one shows the new
- **New dependency:** `@vercel/functions`. Outside Vercel (local dev, tests) the Runtime Cache isn't there, and only the memory copy is used
- **Runtime Cache on Hobby:** shared by all projects of the team (key prefix `rezepte`), separate for production and preview, 2 MB per entry (the table is far below that), usage counted against the plan's included amount. Entries can be evicted at any time, so the copy is a cache, never the source of truth
- A recipe deleted directly in Airtable stays in the copy until the next reload; saving it then fails with Airtable's 403

Measured on production (Sentry, October 2026; first page after a pause, so on a cold server):

|               | Before (memory copy, Washington)           | With a copy (Frankfurt, `fra1`) | Without a copy (Frankfurt)  |
| ------------- | ------------------------------------------ | ------------------------------- | --------------------------- |
| Server render | slowest 5 %: 2.2 s, recipe pages up to 9 s | 189 ms, no Airtable call        | 1.1 s, Airtable 0.8 + 0.2 s |
| Page load     | slowest 5 %: 5.0 s                         | 1.7 s                           | 3.2 s                       |

- The rest of the 1.7 s is mostly Vercel starting the server after a pause (`/login` alone: 1.8 s to the first byte); following pages render in 5–30 ms
- Without a copy, Frankfurt is slower than Washington (page load 2.2 s there), because Airtable is in the US. That's the first load after a deployment to a new region or after the Runtime Cache evicted the entry, so rare

## Revisit when

- The monthly quota runs low (quota 429s are reported to Sentry, see [ADR 0009](0009-error-monitoring.md)), or
- Runtime Cache usage gets near the Hobby limits, or
- Pages are still slow with a copy in place (the server already runs in Frankfurt, see [06-deployment](../specs/06-deployment.md))
