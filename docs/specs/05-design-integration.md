# 05 – Design integration

The visual design is created in **Claude Design**. This spec describes how it becomes code.

## The handoff (2026-09-26)

- **Location:** `design/`. Start with `design/README.md` (German): screens, rules, tokens, assets. Screenshots in `design/screenshots/`
- **Relevant variant:** `playful` only (template branch `isPlay` in `Kochbuch App.dc.html`). The other variants were explorations and are not built
- **Fidelity:** high. Colors, type, spacing, radii, shadows and interactions are final. The mascot Maulti is final as SVG (`Maskottchen.dc.html`, 7 poses)
- **Prototype:** open `design/Kochbuch App.dc.html?variant=playful` in a browser. It needs `support.js` and `data/rezepte.json` next to it
- **Not in git:** `design/Rezepte-Grid view.csv`, `design/data/` and `design/Mahlzeit-Zuordnung.csv` contain our recipe data (the full Airtable export with texts partly copied from other sites and signed image URLs; the list of all recipes with their meals). They're in `.gitignore` because the repo is public. The prototype only runs where these files exist locally
- `design/` is excluded from Prettier, ESLint and type checking; it's reference material, not app code

## Process

1. ✅ Import the design into the repo under `design/` for reference
2. ✅ Update the specs that depend on the design:
   - [01-requirements](01-requirements.md): v1 scope
   - [03-data-model](03-data-model.md): ingredient and step format, Airtable mapping
   - [ADR 0006](../decisions/0006-forms-and-interactivity.md): Preact for islands
   - [ADR 0007](../decisions/0007-styling-approach.md): CSS custom properties, dark mode, self-hosted fonts
   - [ADR 0012](../decisions/0012-pwa-and-timers.md): installable, timers without push
3. Turn the tokens into CSS custom properties in `src/styles/tokens.css`
4. Build components in `src/components/`, one per design component, using tokens only (no hard-coded colors or sizes)
5. Build the screens as pages, using real data from Airtable

## Rules

- The design is the reference. Deviations, for example for technical reasons, are noted below.
- German UI text comes from the design where it's provided.

## Deviations from the design

| Design says                                               | We do                                                    | Why                                                                       |
| --------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| Next.js recommended ("if there's no project yet")         | Astro                                                    | Project already set up ([ADR 0001](../decisions/0001-astro-on-vercel.md)) |
| Fonts from Google Fonts                                   | Self-hosted, same fonts                                  | GDPR ([ADR 0007](../decisions/0007-styling-approach.md))                  |
| Sizes in `px`                                             | `rem`                                                    | System text size; the design README asks for it too                       |
| Timers ring on a locked iPhone (Web Push)                 | Sound, vibration and overlay while the app is open       | [ADR 0012](../decisions/0012-pwa-and-timers.md); push later if needed     |
| No login screen                                           | Login page built from the design's components and tokens | Needed for [04-auth](04-auth.md)                                          |
| Stored in `localStorage` in the prototype (edits, photos) | Written to Airtable                                      | As the design README asks; favorites stay per device                      |
