import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Chip from './Chip.astro';

async function renderChip(props: {
  label: string;
  active?: boolean;
  href?: string;
  name?: string;
  value?: string;
  checked?: boolean;
}) {
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
      href: '/rezepte?category=soup',
      active: true,
    });
    expect(html).toMatch(/<a[^>]*href="\/rezepte\?category=soup"/);
    expect(html).toContain('aria-current="true"');
    expect(html).not.toContain('<button');
  });

  it('does not mark an inactive link as current', async () => {
    const html = await renderChip({ label: 'Suppe', href: '/x' });
    expect(html).not.toContain('aria-current');
  });

  it('is a checkbox inside a label with name, value and state', async () => {
    const html = await renderChip({
      label: 'Suppe',
      name: 'category',
      value: 'soup',
      checked: true,
    });
    expect(html).toMatch(/<label[^>]*>/);
    expect(html).toMatch(/<input[^>]*type="checkbox"/);
    expect(html).toContain('name="category"');
    expect(html).toContain('value="soup"');
    expect(html).toMatch(/<input[^>]*\schecked[\s>=]/);
    expect(html).toContain('Suppe');
    expect(html).not.toContain('<button');
  });

  it('renders an unchecked checkbox without the checked attribute', async () => {
    const html = await renderChip({ label: 'Suppe', name: 'category', value: 'soup' });
    expect(html).not.toMatch(/<input[^>]*\schecked[\s>=]/);
  });
});
