# 0006 – Forms & interactivity

**Status:** Partly accepted. The island framework is open (blocked on the design: edit UX)

## Context

The app edits recipes. Some features need client-side state: image resize before upload (ADR 0005), and possibly a serving scaler, a dynamic ingredient editor and cooking mode.

## Decision (accepted)

- **Mutations** go through Astro Actions with zod validation on the server. Forms work without JS (progressive enhancement)
- **Islands** only where interaction really needs it. One framework for all islands, no mixing
- No global client state and no SPA routing

## Open: island framework

Candidates:

- **Svelte:** small bundles, little boilerplate, syntax close to Astro. The front-runner if the edit UX has dynamic lists (add, remove, reorder ingredient rows)
- **Preact:** React API at about 3 kB. Choose it if React familiarity or a specific React library matters
- **Vanilla / web components:** only if the design ends up with almost no interactivity

## To accept

The design shows the edit form (simple fields vs. dynamic lists, drag and drop?) and which interactive features are in v1.
