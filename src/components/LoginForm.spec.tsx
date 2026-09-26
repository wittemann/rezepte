import { render } from 'preact-render-to-string';
import { describe, expect, it } from 'vitest';
import LoginForm from './LoginForm.tsx';

// The padlock only appears in Maulti's `lock` pose, the question mark only in `think`
const PADLOCK = 'M106 92 V86';
const QUESTION_MARK = '>?</text>';

describe('LoginForm', () => {
  it('is a plain POST form, so it works without JS', () => {
    const html = render(<LoginForm />);
    expect(html).toMatch(/^<form method="post"/);
    expect(html).toContain('<button type="submit"');
  });

  it('marks the field for the password manager', () => {
    const html = render(<LoginForm />);
    expect(html).toContain('type="password"');
    expect(html).toContain('name="password"');
    expect(html).toContain('autocomplete="current-password"');
  });

  it('keeps the show/hide button from submitting the form', () => {
    expect(render(<LoginForm />)).toContain('<button type="button"');
  });

  it('shows Maulti with the padlock and the normal text by default', () => {
    const html = render(<LoginForm />);
    expect(html).toContain(PADLOCK);
    expect(html).toContain('Wie lautet das Passwort?');
    expect(html).toContain('aria-invalid="false"');
  });

  it('shows a thinking Maulti and the error text after a wrong password', () => {
    const html = render(<LoginForm error />);
    expect(html).toContain(QUESTION_MARK);
    expect(html).not.toContain(PADLOCK);
    expect(html).toContain('Hmm, das Passwort stimmt nicht.');
    expect(html).toContain('aria-invalid="true"');
  });
});
