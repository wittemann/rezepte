// Filter sheet of the recipe list (design/README.md, "Rezepte"): open state, BottomSheet and the
// live count. The sheet needs JS (the island); search and meal links work without it.
//
// Everything visible comes from the page as slots, so it uses Button.astro and Chip.astro:
// the opener button (`opener`), the "Zurücksetzen" link (`reset`) and the form (children, with
// chips, hidden fields and the submit button). @astrojs/preact passes children and named slots in
// as static HTML: Preact leaves that markup alone.
// - Opening: a click anywhere in the opener slot counts if it hit the element marked
//   `data-filter-opener` (a real <button>, so Enter and Space click it too).
// - Counting: the island doesn't render the "N Rezepte anzeigen" button. It listens for `change`
//   in the form and sets the text of the element marked `data-apply-label`, using the same
//   filter function as the server (matchesSheetFilters).
// Applying is a normal page load: the state lives in the URL
// (docs/decisions/0006-forms-and-interactivity.md).
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { parseListQuery } from '../lib/recipes/list-query.ts';
import { matchesSheetFilters, type FilterableRecipe } from '../lib/recipes/search.ts';
import BottomSheet from './BottomSheet.tsx';
import { TEXT } from './FilterSheet.texts.ts';

type Props = {
  /** The recipes the filters apply to (search and meal already applied), for counting */
  recipes: FilterableRecipe[];
  // These come from Astro slots, which TypeScript doesn't see as required props
  /** The button that opens the sheet, marked with `data-filter-opener` */
  opener?: ComponentChildren;
  /** "Zurücksetzen" link, shown in the header of the sheet */
  reset?: ComponentChildren;
  /** The form */
  children?: ComponentChildren;
};

export default function FilterSheet({ recipes, opener, reset, children }: Props) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  function openFromOpener(event: MouseEvent) {
    if ((event.target as Element).closest('[data-filter-opener]')) setOpen(true);
  }

  function updateApplyLabel() {
    const form = contentRef.current?.querySelector('form');
    const label = contentRef.current?.querySelector('[data-apply-label]');
    if (!form || !label) return;
    const params = new URLSearchParams();
    for (const [name, value] of new FormData(form)) {
      if (typeof value === 'string') params.append(name, value);
    }
    const { filters } = parseListQuery(params);
    const matching = recipes.filter((recipe) => matchesSheetFilters(recipe, filters));
    label.textContent = TEXT.applyLabel(matching.length);
  }

  // The browser may restore checked boxes after going back, without a `change` event
  useEffect(updateApplyLabel, []);

  return (
    <>
      {/* display: contents keeps the wrapper out of the page layout */}
      <div style={{ display: 'contents' }} onClick={openFromOpener}>
        {opener}
      </div>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={TEXT.filter}
        headerAction={reset}
      >
        <div ref={contentRef} onChange={updateApplyLabel}>
          {children}
        </div>
      </BottomSheet>
    </>
  );
}
