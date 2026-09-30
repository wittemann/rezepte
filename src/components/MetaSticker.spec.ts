import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import MetaSticker from './MetaSticker.astro';

describe('MetaSticker', () => {
  it('shows label and value', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(MetaSticker, {
      props: { label: 'Arbeitszeit', value: '35 Min.' },
    });
    expect(html).toContain('Arbeitszeit');
    expect(html).toContain('35 Min.');
  });
});
