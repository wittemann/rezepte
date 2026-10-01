import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';
import { describe, expect, it, vi } from 'vitest';
import RecipesPage from './index.astro';

vi.mock('astro:env/server', () => ({ AIRTABLE_TOKEN: 'token', AIRTABLE_BASE_ID: 'appTest' }));

// Each of the four filters below removes exactly one of these recipes
vi.mock('../../lib/recipes/repository.ts', async () => {
  const { makeRecipe } = await import('../../lib/recipes/test-recipe.ts');
  const base = { meals: ['Frühstück' as const], category: 'Suppe', totalMinutes: 20 };
  return {
    getAll: async () => [
      makeRecipe({ ...base, id: 'recA', title: 'Beispiel Alpha' }),
      makeRecipe({ ...base, id: 'recB', title: 'Beispiel Beta', category: 'Backen' }),
      makeRecipe({ ...base, id: 'recC', title: 'Beispiel Gamma', totalMinutes: 90 }),
      makeRecipe({ ...base, id: 'recD', title: 'Beispiel Delta', hasInstructions: false }),
      makeRecipe({ ...base, id: 'recE', title: 'Beispiel Epsilon', meals: ['Backen'] }),
      makeRecipe({ ...base, id: 'recF', title: 'Beispiel Zeta', ingredientsText: 'Alpha' }),
    ],
  };
});

async function renderPage(search = '') {
  const container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
  container.addClientRenderer({ name: '@astrojs/preact', entrypoint: '@astrojs/preact/client.js' });
  return container.renderToString(RecipesPage, {
    request: new Request(`http://localhost/rezepte${search}`),
  });
}

function parseDocument(html: string) {
  return new new Window().DOMParser().parseFromString(html, 'text/html');
}

/** Titles of the listed recipes, sorted (grouping changes the page order) */
function listedTitles(html: string) {
  const titles = parseDocument(html).querySelectorAll('[data-recipe-id] .title');
  return [...titles].map((element) => element.textContent).sort();
}

const hrefOf = (html: string, selector: string) =>
  parseDocument(html).querySelector(selector)?.getAttribute('href');

function hrefWithText(html: string, text: string) {
  const links = [...parseDocument(html).querySelectorAll('a')];
  return links.find((link) => link.textContent.trim() === text)?.getAttribute('href');
}

const ALL = ['Alpha', 'Beta', 'Delta', 'Epsilon', 'Gamma', 'Zeta'].map(
  (name) => `Beispiel ${name}`,
);
const without = (...names: string[]) => ALL.filter((title) => !names.includes(title.slice(9)));

describe('recipe list page', () => {
  it('shows all recipes with the count, the recipes tab active, all in one <main>', async () => {
    const html = await renderPage();
    expect(listedTitles(html)).toEqual(ALL);
    expect(html).toContain('6 Rezepte');
    expect(html).not.toContain('gefunden');
    const document = parseDocument(html);
    expect(document.querySelector('a[aria-current="page"]')?.textContent).toContain('Rezepte');
    expect(document.querySelectorAll('main')).toHaveLength(1);
    const main = document.querySelector('main')!;
    expect(main.querySelector('h1')).not.toBeNull();
    expect(main.querySelector('form[role="search"]')).not.toBeNull();
    expect(main.querySelector('[data-recipe-id]')).not.toBeNull();
  });

  it('filters by meal', async () => {
    expect(listedTitles(await renderPage('?meal=breakfast'))).toEqual(without('Epsilon'));
    expect(listedTitles(await renderPage('?meal=baking'))).toEqual(['Beispiel Epsilon']);
  });

  it('filters by category and ignores unknown categories', async () => {
    expect(listedTitles(await renderPage('?category=soup'))).toEqual(without('Beta'));
    expect(listedTitles(await renderPage('?category=soup&category=x'))).toEqual(without('Beta'));
    expect(listedTitles(await renderPage('?category=x'))).toEqual(ALL);
  });

  it('filters by total time', async () => {
    expect(listedTitles(await renderPage('?max30=1'))).toEqual(without('Gamma'));
  });

  it('filters by instructions', async () => {
    expect(listedTitles(await renderPage('?steps=1'))).toEqual(without('Delta'));
  });

  it('shows a flat hit list with the name matches first', async () => {
    const html = await renderPage('?q=alpha');
    expect(html).toContain('2 Rezepte gefunden');
    const titles = [...parseDocument(html).querySelectorAll('[data-recipe-id] .title')];
    expect(titles.map((title) => title.textContent)).toEqual(['Beispiel Alpha', 'Beispiel Zeta']);
  });

  it('shows the empty state when nothing matches', async () => {
    const html = await renderPage('?meal=baking&category=baking');
    expect(html).toContain('Nichts gefunden');
    expect(html).toContain('0 Rezepte');
  });

  it('counts the recipes in the filter button text, and hands only counting data to the island', async () => {
    const html = await renderPage('?category=soup');
    const document = parseDocument(html);
    expect(document.querySelector('[data-apply-label]')?.textContent).toBe('5 Rezepte anzeigen');
    const props = document.querySelector('astro-island')?.getAttribute('props') ?? '';
    expect(props).toContain('totalMinutes');
    expect(props).not.toContain('Beispiel');
  });

  it('renders the opener as an outline Button in the island, named for screen readers', async () => {
    const document = parseDocument(await renderPage('?category=soup&max30=1'));
    const opener = document.querySelector('astro-island astro-slot[name="opener"] button');
    expect(opener?.getAttribute('aria-label')).toBe('Filter, 2 aktiv');
    expect(opener?.getAttribute('aria-haspopup')).toBe('dialog');
    expect(opener?.hasAttribute('data-filter-opener')).toBe(true);
    expect(opener?.getAttribute('class')).toMatch(
      /\boutline\b.*\bactive\b|\bactive\b.*\boutline\b/,
    );
    const hidden = [...opener!.querySelectorAll('span')].map((span) =>
      span.getAttribute('aria-hidden'),
    );
    expect(hidden).toEqual(['true', 'true']); // "Filter" and the count
    // Without filters: plain name, no count, not accent-colored
    const plain = parseDocument(await renderPage()).querySelector('[data-filter-opener]');
    expect(plain?.getAttribute('aria-label')).toBe('Filter');
    expect(plain?.getAttribute('class')).not.toContain('active');
    expect(plain?.querySelectorAll('span')).toHaveLength(1);
  });

  it('keeps a search text from breaking out of the page', async () => {
    const html = await renderPage('?q=' + encodeURIComponent('"><script>x</script>'));
    const document = parseDocument(html);
    const input = document.querySelector('input[name="q"][type="search"]');
    expect(input?.getAttribute('value')).toBe('"><script>x</script>'); // one value, no markup
    expect(
      [...document.querySelectorAll('script')].map((script) => script.textContent),
    ).not.toContain('x');
    expect(html).not.toContain('"><script>x'); // the quote is always escaped
    // The sheet's hidden field holds it the same way
    expect(document.querySelector('input[type="hidden"][name="q"]')?.getAttribute('value')).toBe(
      '"><script>x</script>',
    );
  });

  describe('links', () => {
    const search = '?q=K%C3%A4se&meal=baking&category=soup&max30=1';

    it('meal links keep the search and the filters', async () => {
      const html = await renderPage(search);
      expect(hrefWithText(html, 'Alle')).toBe('/rezepte?q=K%C3%A4se&category=soup&max30=1');
      expect(hrefWithText(html, 'Frühstück')).toBe(
        '/rezepte?q=K%C3%A4se&meal=breakfast&category=soup&max30=1',
      );
      expect(html).toContain('href="/rezepte?q=K%C3%A4se&amp;category=soup&amp;max30=1"');
    });

    it('the clear link keeps the filters and the meal', async () => {
      const html = await renderPage(search);
      expect(hrefOf(html, 'a[aria-label="Suche löschen"]')).toBe(
        '/rezepte?meal=baking&category=soup&max30=1',
      );
      expect(html).toContain('href="/rezepte?meal=baking&amp;category=soup&amp;max30=1"');
    });

    it('reset keeps the search and the meal', async () => {
      const html = await renderPage(search);
      expect(hrefWithText(html, 'Zurücksetzen')).toBe('/rezepte?q=K%C3%A4se&meal=baking');
      expect(html).toContain('href="/rezepte?q=K%C3%A4se&amp;meal=baking"');
    });

    it('the forms keep what they do not send themselves', async () => {
      const document = parseDocument(await renderPage(search));
      const hidden = (form: string) =>
        [...document.querySelectorAll(`${form} input[type="hidden"]`)].map(
          (input) => `${input.getAttribute('name')}=${input.getAttribute('value')}`,
        );
      expect(hidden('form[role="search"]')).toEqual(['meal=baking', 'category=soup', 'max30=1']);
      expect(hidden('form:not([role="search"])')).toEqual(['q=Käse', 'meal=baking']);
    });
  });
});
