import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Pill from './Pill.astro';

async function renderPill(variant?: 'category' | 'time') {
  const container = await AstroContainer.create();
  return container.renderToString(Pill, { props: { variant }, slots: { default: 'Suppe' } });
}

describe('Pill', () => {
  it('shows its text', async () => {
    expect(await renderPill()).toContain('Suppe');
  });

  it('is a category pill by default', async () => {
    expect(await renderPill()).toMatch(/class="pill category/);
  });

  it('can be a time pill', async () => {
    expect(await renderPill('time')).toMatch(/class="pill time/);
  });
});
