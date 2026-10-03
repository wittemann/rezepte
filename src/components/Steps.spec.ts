import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';
import { parseMethod } from '../lib/recipes/method.ts';
import Steps from './Steps.astro';

async function renderSteps(text: string, category?: string) {
  const container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
  const html = await container.renderToString(Steps, {
    props: { method: parseMethod(text), category },
  });
  return new new Window().DOMParser().parseFromString(html, 'text/html');
}

const texts = (document: Awaited<ReturnType<typeof renderSteps>>, selector: string) =>
  [...document.querySelectorAll(selector)].map((element) => element.textContent?.trim());

describe('Steps', () => {
  it('shows a card per step with its number', async () => {
    const document = await renderSteps('1. Erst.\n2. Dann.');
    expect(document.querySelector('h2')?.textContent).toBe('So geht’s');
    expect(texts(document, '.number')).toEqual(['1', '2']);
    expect(texts(document, '.text')).toEqual(['Erst.', 'Dann.']);
  });

  it('shows section headings and keeps counting across sections', async () => {
    const document = await renderSteps('Teig:\n1. Mischen.\nSoße:\n2. Kochen.\n3. Würzen.');
    expect(texts(document, 'h3')).toEqual(['Teig', 'Soße']);
    expect(texts(document, '.number')).toEqual(['1', '2', '3']);
    expect([...document.querySelectorAll('ol')].map((list) => list.getAttribute('start'))).toEqual([
      '1',
      '2',
    ]);
  });

  it('shows the hint after the steps, and no box without one', async () => {
    const withHint = await renderSteps('1. Backen.\n\nTipp: Warm essen.');
    expect(withHint.querySelector('.hint')?.textContent).toBe('Tipp: Warm essen.');
    expect((await renderSteps('1. Backen.')).querySelector('.hint')).toBeNull();
  });

  it('colors the number circles like the category', async () => {
    const document = await renderSteps('1. Backen.', 'Backen');
    expect(document.querySelector('.number')?.getAttribute('style')).toContain(
      '--pastel-cat-baking',
    );
  });
});
