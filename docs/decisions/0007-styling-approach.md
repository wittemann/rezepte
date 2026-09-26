# 0007 – Styling follows the design export

**Status:** Accepted (2026-09-26; outcome recorded after the design handoff)

## Context

The design comes from Claude Design. Styling should mirror its tokens and components with as little translation as possible.

## Decision

- **Rule:** design tokens → CSS custom properties in `src/styles/tokens.css`; component styles as Astro scoped `<style>` blocks (or CSS modules for Preact islands), using tokens only (no hard-coded colors or sizes). Tailwind only if the export had been Tailwind-based
- **Outcome:** the export (`design/`, variant `playful`) uses plain CSS values, no Tailwind. **CSS custom properties it is**
- **Dark mode:** yes, the design defines it. It follows `prefers-color-scheme`, no toggle in the app
- **Colors:** as in the design (hex values plus `oklch()` for accent and pastels). Category and meal pastels are computed from a hue per category: `oklch(L 0.09 H)`
- **Fonts:** Fredoka (display, 500/600) and Nunito (text, 400–800), **self-hosted** via Astro's built-in Fonts API (Fontsource provider; chosen 2026-09-26 over the Fontsource npm packages for automatic preload and adjusted fallback fonts), not loaded from Google Fonts. Embedding Google Fonts sends visitors' IP addresses to Google, which German courts have ruled a GDPR violation. The look is identical
- **Sizes in `rem`**, not the prototype's `px`, so text follows the system text size (design README, "Barrierefreiheit")

## Consequences

- No CSS framework to learn or configure; the tokens file is the single place for colors, fonts, radii and shadows
- The font files ship with the app (two variable fonts, about 110 kB, cached by the browser and the CDN)
- The build downloads the fonts from Fontsource, so it needs network access (Vercel and CI have it). Visitors' browsers only ever load them from our own domain
