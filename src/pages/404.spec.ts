import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ErrorPage from './404.astro';
import { TEXT } from './_404.texts.ts';

describe('404 page', () => {
  it('renders title and texts, without tab bar', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ErrorPage);
    expect(html).toContain(`<title>${TEXT.title}</title>`);
    expect(html).toMatch(new RegExp(`<h1\\b[^>]*>${TEXT.title}</h1>`));
    expect(html).toContain(TEXT.message);
    expect(html).toContain(TEXT.linkText);
    expect(html).not.toContain('href="/favoriten"');
  });
});
