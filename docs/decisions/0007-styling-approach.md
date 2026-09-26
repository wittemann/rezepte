# 0007 – Styling follows the design export

**Status:** Partly accepted. The rule is accepted; the outcome (CSS variables or Tailwind) is open (blocked on the design export)

## Context

The design comes from Claude Design. Styling should mirror its tokens and components with as little translation as possible.

## Decision

- **Default:** design tokens → CSS custom properties in `src/styles/tokens.css`; component styles as Astro scoped `<style>` blocks, using tokens only (no hard-coded colors or sizes)
- **If the Claude Design export is Tailwind-based:** use Tailwind instead, with its theme configured from the same tokens
- Dark mode only if the design defines it

## Consequences

- Which of the two variants applies is decided by looking at the export, with no further discussion needed. Record the outcome here when the design arrives

## To accept

The Claude Design export arrives; record which variant applies and set the status to Accepted.
