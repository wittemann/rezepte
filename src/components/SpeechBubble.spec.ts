import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SpeechBubble from './SpeechBubble.astro';

describe('SpeechBubble', () => {
  it('shows the lead line and the headline', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SpeechBubble, {
      props: { lead: 'Guten Tag! Ich bin Maulti.', headline: 'Was kochen wir heute?' },
    });
    expect(html).toContain('Guten Tag! Ich bin Maulti.');
    expect(html).toContain('Was kochen wir heute?');
  });

  it('uses an h1 for the headline unless told otherwise', async () => {
    const container = await AstroContainer.create();
    const props = { lead: 'a', headline: 'b' };
    expect(await container.renderToString(SpeechBubble, { props })).toMatch(/<h1[^>]*>b</);
    const html = await container.renderToString(SpeechBubble, {
      props: { ...props, headingLevel: 'h2' },
    });
    expect(html).toMatch(/<h2[^>]*>b</);
  });
});
