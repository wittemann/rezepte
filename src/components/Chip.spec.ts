import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Chip from './Chip.astro';

async function renderChip(props: { label: string; active?: boolean; href?: string }) {
  const container = await AstroContainer.create();
  return container.renderToString(Chip, { props });
}

describe('Chip', () => {
  it('is a toggle button without href', async () => {
    const html = await renderChip({ label: 'Suppe' });
    expect(html).toMatch(/<button[^>]*type="button"/);
    expect(html).toContain('>Suppe<');
    expect(html).toContain('aria-pressed="false"');
  });

  it('reports the pressed state', async () => {
    const html = await renderChip({ label: 'Suppe', active: true });
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('data-active="true"');
  });

  it('is a link with href and marks the active one as current', async () => {
    const html = await renderChip({
      label: 'Suppe',
      href: '/rezepte?kategorie=suppe',
      active: true,
    });
    expect(html).toMatch(/<a[^>]*href="\/rezepte\?kategorie=suppe"/);
    expect(html).toContain('aria-current="true"');
    expect(html).not.toContain('<button');
  });

  it('does not mark an inactive link as current', async () => {
    const html = await renderChip({ label: 'Suppe', href: '/x' });
    expect(html).not.toContain('aria-current');
  });
});
