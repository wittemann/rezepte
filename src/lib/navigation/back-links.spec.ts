import { describe, expect, it } from 'vitest';
import { backLandsOn, isListPage, parseLastListPage } from './back-links.ts';

const ORIGIN = 'https://app.example';

describe('isListPage', () => {
  it.each(['/', '/rezepte', '/rezepte?q=suppe&meal=baking', '/favoriten'])(
    'counts %j as a list page',
    (path) => {
      expect(isListPage(new URL(path, ORIGIN))).toBe(true);
    },
  );

  it.each(['/rezepte/rec1', '/rezepte/rec1/edit', '/rezepte/rec1/cook', '/neu', '/login'])(
    'does not count %j',
    (path) => {
      expect(isListPage(new URL(path, ORIGIN))).toBe(false);
    },
  );
});

describe('parseLastListPage', () => {
  it('keeps the search and filters', () => {
    expect(parseLastListPage('/rezepte?q=suppe&steps=1', ORIGIN)).toBe('/rezepte?q=suppe&steps=1');
  });

  it.each([null, '', 'rezepte', '//evil.example/rezepte', '/rezepte/rec1', '/neu'])(
    'refuses %j',
    (stored) => {
      expect(parseLastListPage(stored, ORIGIN)).toBeUndefined();
    },
  );
});

describe('backLandsOn', () => {
  const list = `${ORIGIN}/rezepte?q=suppe`;

  it('goes back when the previous page is the link target', () => {
    expect(backLandsOn(list, list, 3)).toBe(true);
  });

  it('follows the link when the previous page is another one', () => {
    expect(backLandsOn(list, `${ORIGIN}/rezepte/rec1/edit`, 3)).toBe(false);
    expect(backLandsOn(list, `${ORIGIN}/rezepte`, 3)).toBe(false);
  });

  it('follows the link without a previous page', () => {
    expect(backLandsOn(list, '', 1)).toBe(false);
    expect(backLandsOn(list, list, 1)).toBe(false); // opened in a new tab
  });
});
