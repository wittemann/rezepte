import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ErrorMessage from './ErrorMessage.astro';

async function render(props: Record<string, string>) {
  const container = await AstroContainer.create();
  return container.renderToString(ErrorMessage, { props });
}

const props = { title: 'Titel', message: 'Nachricht', linkText: 'Zurück' };

describe('ErrorMessage', () => {
  it('renders heading, message and link', async () => {
    const html = await render(props);
    expect(html).toMatch(/<h1\b[^>]*>Titel<\/h1>/);
    expect(html).toContain('Nachricht');
    expect(html).toMatch(/<a [^>]*href="\/"[^>]*>Zurück<\/a>/);
  });

  it('links to a custom href', async () => {
    const html = await render({ ...props, href: '/login' });
    expect(html).toContain('href="/login"');
  });
});
