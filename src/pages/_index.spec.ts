import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../lib/recipes/recipe.ts';
import { makeRecipe } from '../lib/recipes/test-recipe.ts';
import StartPage from './index.astro';

vi.mock('astro:env/server', () => ({ AIRTABLE_TOKEN: 'token', AIRTABLE_BASE_ID: 'appTest' }));

const recipes = vi.hoisted(() => ({ current: [] as Recipe[] }));
vi.mock('../lib/recipes/repository.ts', () => ({ getAll: async () => recipes.current }));

async function renderPage(search = '') {
  const container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
  const html = await container.renderToString(StartPage, {
    request: new Request(`http://localhost/${search}`),
  });
  return new new Window().DOMParser().parseFromString(html, 'text/html');
}

const text = (document: Awaited<ReturnType<typeof renderPage>>, selector: string) =>
  document.querySelector(selector)?.textContent?.trim();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-02T06:30:00Z')); // Friday, 08:30 in Berlin
  recipes.current = [
    makeRecipe({ id: 'recA', meals: ['Frühstück'], totalMinutes: 10 }),
    makeRecipe({ id: 'recB', meals: ['Frühstück'], totalMinutes: 120 }),
    makeRecipe({ id: 'recC', meals: ['Mittag & Abend'], totalMinutes: 20 }),
  ];
});

afterEach(() => vi.useRealTimers());

describe('start page', () => {
  it('greets with the time of day and asks about the default meal', async () => {
    const document = await renderPage();
    expect(text(document, '.lead')).toBe('Guten Morgen! Ich bin Maulti.');
    expect(text(document, 'main h1')).toBe('Was frühstücken wir heute?');
    expect(document.querySelector('a[aria-current="page"]')?.textContent).toContain('Start');
  });

  it('counts the recipes of the default meal within the weekday time limit', async () => {
    expect(text(await renderPage(), '.matching')).toBe('1 passendes Rezept');
  });

  it('takes meal and time from the URL', async () => {
    const document = await renderPage('?meal=lunch-dinner&time=much');
    expect(text(document, 'main h1')).toBe('Was kochen wir heute?');
    expect(text(document, '.matching')).toBe('1 passendes Rezept');
    const current = [...document.querySelectorAll('main [aria-current="true"]')];
    expect(current.map((element) => element.textContent?.trim().replace(/\s+/g, ' '))).toEqual([
      'Abend',
      'Viel Zeitauch Aufwendiges',
    ]);
  });

  it('links the other options and keeps the rest of the state', async () => {
    const document = await renderPage('?meal=breakfast&time=much');
    const hrefs = [...document.querySelectorAll('main a')].map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/?meal=baking&time=much');
    expect(hrefs).toContain('/?meal=breakfast&time=little');
  });

  it('shows the shorter baking limit as hint', async () => {
    expect(text(await renderPage('?meal=baking'), '.hint')).toBe('bis 90 Min.');
  });

  it('suggests recipes of the meal within the time limit, each linking to its recipe', async () => {
    const document = await renderPage();
    const cards = [...document.querySelectorAll('[data-suggestion-id]')];
    expect(cards.map((card) => card.getAttribute('href'))).toEqual(['/rezepte/recA']);
  });

  it('rolls the dice by counting up in the URL', async () => {
    const first = await renderPage('?meal=breakfast&time=much');
    expect(first.querySelector('.reroll')?.getAttribute('href')).toBe(
      '/?meal=breakfast&time=much&dice=1',
    );
    const second = await renderPage('?meal=breakfast&time=much&dice=4');
    expect(second.querySelector('.reroll')?.getAttribute('href')).toBe(
      '/?meal=breakfast&time=much&dice=5',
    );
  });

  it('tells Maulti found nothing instead of showing cards', async () => {
    const document = await renderPage('?meal=baking');
    expect(document.querySelectorAll('[data-suggestion-id]')).toHaveLength(0);
    expect(document.querySelector('main')?.textContent).toContain('dazu finde ich nichts');
  });
});
