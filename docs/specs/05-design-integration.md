# 05 – Design integration

The visual design is created in **Claude Design**. This spec describes how it becomes code.

## Inputs expected from the design

- **Tokens:** colors (light/dark?), typography, spacing, radii, shadows
- **Screens:** login, recipe list, recipe detail, edit/create form, plus any extras (search, cooking mode, shopping list …)
- **Components:** cards, tag chips, ingredient list, step list, buttons, form fields, navigation
- **Content decisions:** ingredient structure, how steps look, image usage (hero image? gallery?)

## Process

1. Import the design into the repo (via the design-sync integration or an export) under `design/` for reference
2. Turn the tokens into CSS custom properties in `src/styles/tokens.css` → closes [ADR 0007](../decisions/0007-styling-approach.md)
3. Build components in `src/components/`, one per design component, using tokens only (no hard-coded colors or sizes)
4. Build the screens as pages, using real data from Airtable
5. Update the specs that depend on the design:
   - [01-requirements](01-requirements.md): v1 scope
   - [03-data-model](03-data-model.md): ingredient structure
   - [ADR 0006](../decisions/0006-forms-and-interactivity.md): pick the island framework based on the edit UX
   - [ADR 0007](../decisions/0007-styling-approach.md): record whether CSS variables or Tailwind applies

## Rules

- The design is the reference. Deviations, for example for technical reasons, are noted here.
- German UI text comes from the design where it's provided.
