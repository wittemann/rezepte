import { render } from 'preact-render-to-string';
import { describe, expect, it } from 'vitest';
import Icon, { type IconName } from './Icon.tsx';

const NAMES: IconName[] = [
  'home',
  'search',
  'heart',
  'plus',
  'filter',
  'back',
  'grill',
  'main',
  'side',
  'salad',
  'soup',
  'dessert',
  'baking',
  'basics',
];

describe('Icon', () => {
  it.each(NAMES)('draws the %s icon as a decorative line icon', (name) => {
    const svg = render(<Icon name={name} />);
    expect(svg).toMatch(/^<svg[^>]*aria-hidden="true"/);
    expect(svg).toMatch(/<path d="M[^"]+"/);
  });

  it('gives every icon its own shape', () => {
    const shapes = new Set(NAMES.map((name) => render(<Icon name={name} />)));
    expect(shapes.size).toBe(NAMES.length);
  });

  it('takes its color from the surrounding text', () => {
    const svg = render(<Icon name="home" />);
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('fill="none"');
  });

  it('fills the shape when asked, e.g. an active favorite', () => {
    expect(render(<Icon name="heart" filled />)).toContain('fill="currentColor"');
  });

  it('converts size from px to rem and passes the line width through', () => {
    const svg = render(<Icon name="grill" size={36} strokeWidth={1.8} />);
    expect(svg).toContain('width:2.25rem;height:2.25rem');
    expect(svg).toContain('stroke-width="1.8"');
  });
});
