import preactRenderer from '@astrojs/preact/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import TabBar, { type TabId } from './TabBar.astro';

async function renderBar(active: TabId) {
  const container = await AstroContainer.create();
  // Icon is a Preact component
  container.addServerRenderer({ name: '@astrojs/preact', renderer: preactRenderer });
  return container.renderToString(TabBar, { props: { active } });
}

/** The href of every link matching the pattern, in page order */
function hrefs(html: string, linkPattern: RegExp) {
  const links = html.match(/<a\b[^>]*>/g) ?? [];
  return links
    .filter((link) => linkPattern.test(link))
    .map((link) => /href="([^"]*)"/.exec(link)?.[1] ?? '');
}

describe('TabBar', () => {
  it('links to the four sections', async () => {
    const html = await renderBar('home');
    expect(hrefs(html, /./)).toEqual(['/', '/recipes', '/favorites', '/new']);
  });

  it.each([
    ['home', '/'],
    ['recipes', '/recipes'],
    ['favorites', '/favorites'],
  ] as const)('marks only the %s tab as current', async (active, href) => {
    const html = await renderBar(active);
    expect(hrefs(html, /aria-current="page"/)).toEqual([href]);
  });

  it('fills the heart only while favorites is active', async () => {
    const filledIcons = async (active: TabId) =>
      ((await renderBar(active)).match(/fill="currentColor"/g) ?? []).length;
    expect(await filledIcons('favorites')).toBe(1);
    expect(await filledIcons('home')).toBe(0);
  });
});
