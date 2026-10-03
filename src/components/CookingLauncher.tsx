// Opens cooking mode on the recipe page itself instead of loading /cook. Safari only grants the
// screen wake lock right after a tap, and loading a new page loses that tap; on the same page, the
// tap on "Los, wir kochen!" still counts when cooking mode asks for the lock (use-wake-lock.ts).
// The link keeps working without JS and before this island has loaded: it then loads /cook.
// While cooking, the recipe page is hidden and the URL is /cook, so the back button closes it.
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { CookingStep } from '../lib/recipes/cooking-steps.ts';
import type { IngredientLine } from '../lib/recipes/ingredients.ts';
import CookingMode from './CookingMode.tsx';

type Props = {
  recipeId: string;
  recipeHref: string;
  /** Cooking mode as a page of its own; taps on links to it open it here instead */
  cookHref: string;
  hasPhoto: boolean;
  steps: CookingStep[];
  ingredients: IngredientLine[];
  servings?: number;
};

/** Marks the content of the recipe page, which is hidden while cooking. */
const RECIPE_PAGE_SELECTOR = '[data-recipe-page]';

export default function CookingLauncher({ cookHref, ...cookingProps }: Props) {
  const [open, setOpen] = useState(false);
  const scrollYRef = useRef(0);
  const reloadOnCloseRef = useRef(false);

  // Before paint, so the recipe page and cooking mode never show together
  useLayoutEffect(() => {
    const page = document.querySelector<HTMLElement>(RECIPE_PAGE_SELECTOR);
    if (!page) return;
    if (open) {
      scrollYRef.current = window.scrollY;
      page.hidden = true;
      window.scrollTo(0, 0);
    } else if (page.hidden) {
      page.hidden = false;
      window.scrollTo(0, scrollYRef.current);
    }
  }, [open]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      // A plain click only: opening in a new tab still loads /cook
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(`a[href="${cookHref}"]`)) return;
      event.preventDefault();
      history.pushState({ cooking: true }, '', cookHref);
      setOpen(true);
    }

    // Back (and forward) between the recipe page and cooking mode
    function handlePopState(event: PopStateEvent) {
      const cooking = (event.state as { cooking?: boolean } | null)?.cooking === true;
      if (!cooking && reloadOnCloseRef.current) {
        window.location.reload(); // shows the photo added in cooking mode
        return;
      }
      setOpen(cooking);
    }

    document.addEventListener('click', handleClick);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [cookHref]);

  function close(photoAdded: boolean) {
    reloadOnCloseRef.current = photoAdded;
    history.back(); // closes it through popstate, like the browser's back button
  }

  return open ? <CookingMode {...cookingProps} onClose={close} /> : null;
}
