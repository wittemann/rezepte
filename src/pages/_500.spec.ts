import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ErrorPage from './500.astro';
import { TEXT } from './_500.texts.ts';

async function render(props: Record<string, unknown> = {}) {
  const container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
  container.addClientRenderer({ name: '@astrojs/preact', entrypoint: '@astrojs/preact/client.js' });
  return container.renderToString(ErrorPage, { props });
}

describe('500 page', () => {
  it('renders title and texts, without tab bar', async () => {
    const html = await render();
    expect(html).toContain(`<title>${TEXT.title}</title>`);
    expect(html).toMatch(new RegExp(`<h1\\b[^>]*>${TEXT.title}</h1>`));
    expect(html).toContain(TEXT.message);
    expect(html).toContain(TEXT.linkText);
    expect(html).not.toContain('href="/favoriten"');
  });

  it('does not leak error details', async () => {
    const html = await render({ error: new Error('SECRET_DETAIL') });
    expect(html).not.toContain('SECRET_DETAIL');
  });
});
