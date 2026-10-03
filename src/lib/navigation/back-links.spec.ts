import { describe, expect, it } from 'vitest';
import { backLandsOn, isListPage, parseLastListPage } from './back-links.ts';

const ORIGIN = 'https://app.example';

describe('isListPage', () => {
  it.each(['/', '/recipes', '/recipes?q=suppe&meal=baking', '/favorites'])(
    'counts %j as a list page',
    (path) => {
      expect(isListPage(new URL(path, ORIGIN))).toBe(true);
    },
  );

  it.each(['/recipes/rec1', '/recipes/rec1/edit', '/recipes/rec1/cook', '/new', '/login'])(
    'does not count %j',
    (path) => {
      expect(isListPage(new URL(path, ORIGIN))).toBe(false);
    },
  );
});

describe('parseLastListPage', () => {
  it('keeps the search and filters', () => {
    expect(parseLastListPage('/recipes?q=suppe&steps=1', ORIGIN)).toBe('/recipes?q=suppe&steps=1');
  });

  it.each([null, '', 'recipes', '//evil.example/recipes', '/recipes/rec1', '/new'])(
    'refuses %j',
    (stored) => {
      expect(parseLastListPage(stored, ORIGIN)).toBeUndefined();
    },
  );
});

describe('backLandsOn', () => {
  const list = `${ORIGIN}/recipes?q=suppe`;

  it('goes back when the previous page is the link target', () => {
    expect(backLandsOn(list, list, 3)).toBe(true);
  });

  it('follows the link when the previous page is another one', () => {
    expect(backLandsOn(list, `${ORIGIN}/recipes/rec1/edit`, 3)).toBe(false);
    expect(backLandsOn(list, `${ORIGIN}/recipes`, 3)).toBe(false);
  });

  it('follows the link without a previous page', () => {
    expect(backLandsOn(list, '', 1)).toBe(false);
    expect(backLandsOn(list, list, 1)).toBe(false); // opened in a new tab
  });
});
