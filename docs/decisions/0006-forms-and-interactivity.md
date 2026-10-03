# 0006 – Forms & interactivity

**Status:** Accepted (2026-09-26; island framework decided after the design handoff)

## Context

The app edits recipes, and the design has a lot of client-side interaction: serving scaler, search and filter sheet, suggestion carousel with "Nochmal würfeln", favorites (heart), cooking mode with swipe, timers and the photo step (resize before upload, ADR 0005). The edit form itself is simple: text fields, chips and textareas, no dynamic lists or drag and drop.

## Decision

- **Mutations** go through Astro Actions with zod validation on the server. Forms work without JS (progressive enhancement)
- **Islands** only where interaction really needs it. One framework for all islands, no mixing
- **Island framework: Preact** (with the official `@astrojs/preact` integration). React API at about 3 kB; chosen by the project owner (2026-09-26) for the familiar React style
- No global client state and no SPA routing. State that has to survive a page change lives in the URL. Favorites are shared and live in Airtable (`Favorit seit`), toggled through an Action; the design's per-device `localStorage` favorites were dropped (2026-10-01)

## Consequences

- Pages stay server-rendered; islands hydrate only where needed (e.g. `client:visible` for the carousel, `client:load` for cooking mode)
- Svelte was the alternative with slightly smaller bundles; not a deciding factor at this size
- Verify the `@astrojs/preact` version and options against the current Astro docs at implementation time
