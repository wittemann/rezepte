# 0003 – Plain SSR, no caching for now

**Status:** Accepted

## Context

Airtable limits API usage (5 requests/s per base; the free plan may also have a monthly API-call cap). With only two users, the rate limit isn't a realistic problem. Caching adds complexity (invalidation after writes, stale data after edits in Airtable).

## Decision

- Every request reads live from Airtable. No CDN cache, ISR or data cache
- Keep calls cheap anyway: the list is one paginated request, the detail view is one request, and there are no N+1 patterns

## Consequences

- Always fresh data, including edits made directly in Airtable
- Page speed depends on Airtable's latency

## Revisit when

- Airtable returns 429 errors (reported to Sentry, see [ADR 0009](0009-error-monitoring.md); Vercel Hobby keeps runtime logs for only 1 hour), or
- The monthly API-call quota runs low, or
- Pages feel slow

Then add CDN caching (`Cache-Control` / ISR) with invalidation after writes.
