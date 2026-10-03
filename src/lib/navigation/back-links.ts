// "Back" links that really go back (docs/bugs.md): the back arrow on the recipe page and
// „Abbrechen“ in the recipe form. A link marked `data-back` goes back in the history when the
// previous page is the one it points to, so the list keeps its search, filters and scroll
// position. Otherwise it's followed like any other link.
// A link marked `data-back-to-list` points to the list page seen last in this session: the start
// page, the recipe list (with its search and filters) or the favorites. Its server-rendered href
// is the fallback for a direct visit.

const LIST_PATHS = ['/', '/rezepte', '/favoriten'];
const LAST_LIST_PAGE_KEY = 'lastListPage';

export function isListPage(url: URL) {
  return LIST_PATHS.includes(url.pathname);
}

/** The stored list page as a local path, or undefined if it's missing or not a list page */
export function parseLastListPage(stored: string | null, origin: string) {
  if (!stored?.startsWith('/')) return undefined;
  let url: URL;
  try {
    url = new URL(stored, origin);
  } catch {
    return undefined;
  }
  if (url.origin !== origin || !isListPage(url)) return undefined;
  return url.pathname + url.search;
}

/** Whether going back in the history lands on `href` (both absolute URLs) */
export function backLandsOn(href: string, referrer: string, historyLength: number) {
  return historyLength > 1 && referrer === href;
}

/** Runs on every page (Base.astro) */
export function setUpBackLinks() {
  rememberListPage();
  pointBackLinksToList();
  // A page restored from the back-forward cache doesn't run its scripts again
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    rememberListPage();
    pointBackLinksToList();
  });
  document.addEventListener('click', goBackInstead);
}

function rememberListPage() {
  if (!isListPage(new URL(location.href))) return;
  try {
    sessionStorage.setItem(LAST_LIST_PAGE_KEY, location.pathname + location.search);
  } catch {
    // Storage blocked (e.g. private mode): the back arrow keeps its fallback
  }
}

function pointBackLinksToList() {
  let stored: string | null;
  try {
    stored = sessionStorage.getItem(LAST_LIST_PAGE_KEY);
  } catch {
    return; // Storage blocked: the back arrow keeps its fallback
  }
  const lastListPage = parseLastListPage(stored, location.origin);
  if (!lastListPage) return;
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-back-to-list]')) {
    link.href = lastListPage;
  }
}

function goBackInstead(event: MouseEvent) {
  // A plain click only: opening in a new tab follows the link
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest<HTMLAnchorElement>('a[data-back]');
  if (!link || !backLandsOn(link.href, document.referrer, history.length)) return;
  event.preventDefault();
  history.back();
}
