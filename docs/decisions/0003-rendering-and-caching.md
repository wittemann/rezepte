# 0003 – Plain SSR with an in-memory copy of the recipe table

**Status:** Accepted

## Context

Airtable's free plan allows **1,000 API calls per workspace per month** (resets on the 1st; after a 30-day grace period, calls over the limit are blocked) and 5 requests/s per base. We stay on the free plan. Reading live on every request cost at least one call per page view, one per image cache miss and two per write, so the monthly budget lasted days.

Recipes are also added directly in Airtable (e.g. through Claude), not only in the app.

## Decision

- Pages stay plain SSR. No CDN cache or ISR for pages (they are behind the login)
- The repository (`lib/recipes/repository.ts`) keeps the **whole recipe table in memory**, one copy per server instance, for **15 minutes**. Every read (list, detail, image proxy, the existence check before a write) uses it
- Every write in the app clears it, so the next read loads it fresh
- Concurrent reads share one load; a failed load isn't kept
- The TTL must stay well below the ~2 hours after which Airtable's attachment URLs in the records expire
- A 429 for the monthly quota fails right away; only a rate-limit 429 waits 30 s and retries

Rejected for now:

- **Vercel Runtime Cache** (shared across instances, tag invalidation): extra dependency and network hop, Hobby usage limits not clearly documented, and a single instance is the normal case at this traffic
- **Airtable webhooks or automations** to clear the cache on direct edits: webhooks expire after 7 days unless refreshed (costing calls), and they would reach only one instance too

## Consequences

- Most page views make no Airtable call; pages no longer wait for Airtable's latency
- Roughly one call per app session after idle time plus two per write: fits the free plan for family use, but not by a wide margin
- Recipes added or changed directly in Airtable show up after at most 15 minutes
- If Vercel runs several instances, a save on one leaves the others on the old copy for up to 15 minutes
- A recipe deleted directly in Airtable can still be in the copy; saving it then fails with Airtable's 403

## Revisit when

- The monthly quota runs low (quota 429s are reported to Sentry, see [ADR 0009](0009-error-monitoring.md)), or
- Stale data after a save shows up in practice (several instances), or
- Waiting for recipes added directly in Airtable gets annoying: see the refresh endpoint under "Later" in [01-requirements](../specs/01-requirements.md)
