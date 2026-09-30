import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Button, { type Props as ButtonProps } from './Button.astro';

type Props = Record<string, unknown>;

async function renderButton(props: Props = {}, slot = 'Los geht’s'): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Button, { props, slots: { default: slot } });
}

/** The CSS classes of the first element */
function classes(html: string): string[] {
  return (/class="([^"]*)"/.exec(html)?.[1] ?? '').split(' ');
}

describe('Button', () => {
  it('is a plain button by default, so it never submits a form by accident', async () => {
    const html = await renderButton();
    expect(html).toMatch(/<button[^>]*type="button"/);
    expect(html).toContain('Los geht’s');
  });

  it('can submit', async () => {
    expect(await renderButton({ type: 'submit' })).toMatch(/<button[^>]*type="submit"/);
  });

  it('is a link with href', async () => {
    const html = await renderButton({ href: '/rezepte/recExample1' });
    expect(html).toMatch(/<a[^>]*href="\/rezepte\/recExample1"/);
    expect(html).not.toContain('<button');
  });

  it('is primary and large by default', async () => {
    expect(classes(await renderButton())).toEqual(expect.arrayContaining(['primary', 'large']));
  });

  it('takes the size only for primary buttons', async () => {
    expect(classes(await renderButton({ size: 'medium' }))).toContain('medium');
    expect(classes(await renderButton({ variant: 'outline', size: 'medium' }))).not.toContain(
      'medium',
    );
  });

  it('names a round button for screen readers', async () => {
    const html = await renderButton({ variant: 'round', label: 'Zurück' }, '');
    expect(html).toContain('aria-label="Zurück"');
    expect(classes(html)).toContain('round');
  });

  it('marks the active state', async () => {
    const html = await renderButton({ variant: 'outline', active: true }, 'Filter');
    expect(classes(html)).toContain('active');
    expect(html).not.toContain('aria-pressed');
  });

  it('needs a label for a round button (type level)', () => {
    // @ts-expect-error a round button without label doesn't type-check
    const withoutLabel: ButtonProps = { variant: 'round' };
    const withLabel: ButtonProps = { variant: 'round', label: 'Zurück' };
    expect([withoutLabel, withLabel]).toHaveLength(2);
  });

  it('has no aria-label unless given', async () => {
    expect(await renderButton()).not.toContain('aria-label');
  });
});
