# 05 – Design integration

The visual design is created in **Claude Design**. This spec describes how it becomes code.

## The handoff (2026-09-26)

- **Location:** `design/`. Start with `design/README.md` (German): screens, rules, tokens, assets. Screenshots in `design/screenshots/`
- **Relevant variant:** `playful` only (template branch `isPlay` in `Kochbuch App.dc.html`). The other variants were explorations and are not built
- **Fidelity:** high. Colors, type, spacing, radii, shadows and interactions are final. The mascot Maulti is final as SVG (`Maskottchen.dc.html`, 8 poses incl. `lock` for the login; `maulti-login.svg`)
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
- German UI text comes from the design where it's provided. It lives in a `<Component>.texts.ts` file next to the component (`export const TEXT = { … }`), not inline in the markup, so all texts are easy to find. Pages use `_<page>.texts.ts` next to the page; the leading `_` keeps Astro from turning it into a route.
- The prototype code isn't fully up to date. Known case: its `playful` tab bar still has a raised accent button for „Neu“. `design/README.md` and the screenshots are correct: four equal tabs, „Neu“ is a normal tab with the plus icon, the active tab is `ink` with an accent dot (confirmed by the project owner, 2026-09-26). Where code and README/screenshots disagree, check with the project owner.

## Deviations from the design

| Design says                                               | We do                                              | Why                                                                                           |
| --------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Next.js recommended ("if there's no project yet")         | Astro                                              | Project already set up ([ADR 0001](../decisions/0001-astro-on-vercel.md))                     |
| Fonts from Google Fonts                                   | Self-hosted, same fonts                            | GDPR ([ADR 0007](../decisions/0007-styling-approach.md))                                      |
| Sizes in `px`                                             | `rem`                                              | System text size; the design README asks for it too                                           |
| Timers ring on a locked iPhone (Web Push)                 | Sound, vibration and overlay while the app is open | [ADR 0012](../decisions/0012-pwa-and-timers.md); push later if needed                         |
| Login: env var "e.g. `FAMILY_PASSWORD`"                   | `APP_PASSWORD_HASH` (scrypt hash)                  | Naming example only; ours is set up ([04-auth](04-auth.md))                                   |
| Login: optional rate limit, 5 attempts/min per IP         | ~500 ms delay per failed attempt                   | Per-IP counting on serverless needs a shared store; revisit on abuse ([04-auth](04-auth.md))  |
| All routes behind login, incl. images                     | Image proxy cached by the CDN without login check  | Deliberate ([ADR 0005](../decisions/0005-image-handling.md))                                  |
| No error pages                                            | Plain error pages (404, 500), no design for v1     | Rarely seen; not worth a design yet                                                           |
| No logout                                                 | No logout in v1                                    | Sessions last about a year; see [04-auth](04-auth.md)                                         |
| Filter sheet: one category at a time (prototype)          | Several categories can be selected                 | Project owner's decision (2026-09-30); the button count still counts categories as one        |
| Stored in `localStorage` in the prototype (edits, photos) | Written to Airtable                                | As the design README asks                                                                     |
| Favorites per device (`localStorage`)                     | Favorites shared by everyone, field `Favorit seit` | Project owner's decision (2026-10-01): one shared password, rarely changed, no personal state |
| Edit form: „Quelle“ as a text field                       | A list of the known sources                        | Quelle only takes known values ([03-data-model](03-data-model.md), Data conventions)          |
