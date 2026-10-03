import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SegmentedControl, { type SegmentedOption } from './SegmentedControl.astro';

async function renderControl(options: SegmentedOption[]) {
  const container = await AstroContainer.create();
  return container.renderToString(SegmentedControl, {
    props: { label: 'Wie viel Zeit?', options },
  });
}

describe('SegmentedControl', () => {
  it('names the group', async () => {
    const html = await renderControl([{ label: 'Alle', active: true }]);
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Wie viel Zeit?"');
  });

  it('renders toggle buttons with their pressed state', async () => {
    const html = await renderControl([
      { label: 'Alle', active: true },
      { label: 'Backen', active: false },
    ]);
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(1);
    expect(html.match(/data-active="true"/g)).toHaveLength(1);
  });

  it('renders links when options have an href, only the active one is current', async () => {
    const html = await renderControl([
      { label: 'Alle', active: true, href: '/rezepte' },
      { label: 'Backen', active: false, href: '/rezepte?meal=baking' },
    ]);
    expect(html).not.toContain('<button');
    expect(html).toContain('href="/rezepte?meal=baking"');
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
  });

  it('shows the hint line when given', async () => {
    const html = await renderControl([
      { label: 'Wenig Zeit', hint: 'bis 30 Min.', active: true },
      { label: 'Viel Zeit', active: false },
    ]);
    expect(html).toContain('bis 30 Min.');
    expect(html.match(/class="hint/g)).toHaveLength(1);
  });
});
