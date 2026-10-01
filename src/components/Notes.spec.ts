import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';
import Notes from './Notes.astro';

describe('Notes', () => {
  it('is a closed <details> with the notes, expandable without JavaScript', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Notes, { props: { notes: 'Gut vorbereiten.' } });
    const document = new new Window().DOMParser().parseFromString(html, 'text/html');
    const details = document.querySelector('details')!;
    expect(details.hasAttribute('open')).toBe(false);
    expect(details.querySelector('summary')?.textContent).toContain('Notizen & Tipps');
    expect(details.querySelector('.text')?.textContent).toBe('Gut vorbereiten.');
  });
});
