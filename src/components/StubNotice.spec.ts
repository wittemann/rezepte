import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';
import StubNotice from './StubNotice.astro';

describe('StubNotice', () => {
  it('says the instructions are missing and links to the edit form', async () => {
    const container = await AstroContainer.create();
    container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
    const html = await container.renderToString(StubNotice, {
      props: { editHref: '/rezepte/recX1/bearbeiten' },
    });
    const document = new new Window().DOMParser().parseFromString(html, 'text/html');
    expect(document.body.textContent).toContain('Hier fehlt noch die Anleitung');
    expect(document.querySelector('svg')).not.toBeNull();
    const link = document.querySelector('a')!;
    expect(link.textContent?.trim()).toBe('Rezept ergänzen');
    expect(link.getAttribute('href')).toBe('/rezepte/recX1/bearbeiten');
  });
});
