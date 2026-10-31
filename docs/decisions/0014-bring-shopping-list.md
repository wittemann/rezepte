# 0014 – Shopping list: send picked ingredients to Bring!

**Status:** Proposed (2026-10-18)

## Context

The family uses Bring! as its shopping list. The recipe page should be able to put a recipe's ingredients on that list, like Chefkoch does. Not every ingredient belongs there: salt, oil or spices are usually at home, so the user picks the items before sending.

The options:

- **Bring's official import** (button, or the deeplink `api.getbring.com/rest/bringrecipes/deeplink?url=…`): Bring's server fetches the recipe page and parses its schema.org markup. Our pages are behind the login, so it would need a public link per recipe. **Ruled out by the project owner:** no public links to our recipes, not even unguessable ones. It also can't drop single items
- **Unofficial Bring API** (`api.getbring.com/rest/v2/`, used by the Bring apps): log in with a Bring account, add items to a list. Community clients exist (npm `bring-shopping` 2.0.1, Python `bring-api` behind Home Assistant's Bring integration). Not documented, not endorsed by Bring
- **Copy to clipboard**, paste into Bring by hand: no integration, clumsy

## Decision

- **Unofficial Bring API, server side.** The app logs in with one Bring account (`BRING_EMAIL`, `BRING_PASSWORD` in env vars, [06-deployment](../specs/06-deployment.md)) and adds items to one list (`BRING_LIST_UUID`). Use a dedicated Bring account that is a member of the family list, not someone's personal login
- **Own small client** with `fetch`, like the Airtable client ([ADR 0002](0002-airtable-as-source-of-truth.md)): only login (`POST bringauth`) and add item (`PUT bringlists/{listUuid}`, `purchase` = name, `specification` = amount). No dependency for two calls. Log in per request; cache the token only if that turns out slow
- **Pick before sending:** a sheet on the recipe page lists the ingredient lines with a checkbox each, all checked; headings („Für den Teig:“) are shown as group titles, not as items. The user unchecks what's at home and taps „Zu Bring! hinzufügen“. Nothing is remembered between recipes
- **What gets sent:** the parsed ingredient (`IngredientLine`, [03-data-model](../specs/03-data-model.md)): the amount and unit as `specification` (scaled to the servings currently shown), the rest as the item name, so Bring can match its catalog and icons. Lines the parser can't split go in whole as the name
- **Astro Action** `addToBring` ([ADR 0006](0006-forms-and-interactivity.md)), behind the login; it gets the recipe id and the picked lines and validates them on the server. On error, a German message in the sheet; the list stays as it was

## Consequences

- No public links; only the picked ingredient names and amounts leave the app, to Bring
- The API can change without notice. Then the button fails with an error message until the client is fixed. Sentry ([ADR 0009](0009-error-monitoring.md)) reports it
- Everyone using the app writes to the same Bring list
- Probably not allowed by Bring's terms. The project owner accepts that at family scale
- A Bring password in Vercel env vars: one more secret, never in the repo
- The design has none of this: placement and look of the button and sheet are decided by the project owner, noted in [05-design-integration](../specs/05-design-integration.md)

## To accept

- Spike: from a Vercel function, log in with the Bring account and add one item to the family list; check it shows up in the app (Bring might block server IPs)
  - 2026-10-31, pre-check without an account: from a Vercel Sandbox in `fra1` (AWS Frankfurt), `POST bringauth` with made-up credentials got Bring's normal `401` („email password combination not existing“), no firewall page, no timeout. So Bring doesn't block Vercel's network. Still open: a real login and adding an item, from a function
- Project owner's OK on a dedicated Bring account
