import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';
import CookButton from './CookButton.astro';

describe('CookButton', () => {
  it('is a link to cooking mode with the call to action', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CookButton, {
      props: { href: '/recipes/recX1/cook' },
    });
    const link = new new Window().DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector('a')!;
    expect(link.textContent?.trim()).toBe('Los, wir kochen!');
    expect(link.getAttribute('href')).toBe('/recipes/recX1/cook');
  });
});
