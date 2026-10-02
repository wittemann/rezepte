# Bugs

Known bugs, found while using the app. Fixed like every other change: small commit, manual review ([implementation-plan](implementation-plan.md), "How we work"). A fixed bug is ticked off in the commit that fixes it; a bug with a visible effect gets a test that would have caught it, where feasible. `sonnet` etc. = the model to use, as in the plan.

- [ ] Back button on the recipe page always goes to `/rezepte`, also when coming from the start page (or favorites). Go back to where the user came from, with `/rezepte` as the fallback for a direct visit · `sonnet`
- [ ] Home-screen app on iPhone: the page headline sits under the iOS status bar blur (seen on Rezepte list); fix top clearance, check on device · `sonnet`
- [ ] Double-tap zoom on the servings stepper: tapping − or + quickly zooms the page on iOS. Add `touch-action: manipulation` to the stepper buttons (or globally to buttons and links); check other quickly tapped controls · `haiku`
- [ ] Recipe page scrolls sideways: the page must never be wider than the screen. Not reproducible in the browser at 375 px with normal text; with a very large system text size the servings stepper pushes past the right edge. Find the cause on a real iPhone, then check all screens with large text · `sonnet`
