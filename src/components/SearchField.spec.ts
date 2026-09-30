import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SearchField from './SearchField.astro';

async function renderField(query: string, hiddenFields: [string, string][] = []) {
  const container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
  return container.renderToString(SearchField, {
    props: { query, hiddenFields, clearHref: '/rezepte?meal=baking' },
  });
}

describe('SearchField', () => {
  it('is a GET form to the list that sends q', async () => {
    const html = await renderField('');
    expect(html).toContain('method="get"');
    expect(html).toContain('action="/rezepte"');
    expect(html).toContain('name="q"');
    expect(html).toContain('placeholder="Worauf hast du Lust?"');
  });

  it('keeps other parameters as hidden fields', async () => {
    const html = await renderField('', [
      ['meal', 'baking'],
      ['category', 'soup'],
    ]);
    expect(html).toContain('name="meal" value="baking"');
    expect(html).toContain('name="category" value="soup"');
  });

  it('shows the query escaped, with a clear link', async () => {
    const html = await renderField('"><script>x</script>');
    expect(html).toContain('value="&quot;><script>x</script>"'); // the quote can't end the attribute
    expect(html).toContain('href="/rezepte?meal=baking"');
  });

  it('has no clear link without a query', async () => {
    expect(await renderField('')).not.toContain('Suche löschen');
  });
});
