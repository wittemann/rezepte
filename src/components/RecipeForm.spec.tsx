// @vitest-environment happy-dom
import { render } from 'preact';
import { render as renderToString } from 'preact-render-to-string';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { emptyFormValues } from '../lib/recipes/form.ts';
import RecipeForm from './RecipeForm.tsx';

const values = {
  ...emptyFormValues(),
  title: 'Testsuppe',
  category: 'Suppe',
  meals: ['Backen'],
  workTime: '0:20',
  ingredients: 'Salz',
  source: 'Chefkoch',
};

describe('RecipeForm, rendered on the server', () => {
  it('is a plain POST form with the values filled in', () => {
    const html = renderToString(<RecipeForm isNew={false} values={values} cancelHref="/back" />);
    expect(html).toMatch(/^<form method="post"/);
    expect(html).toContain('value="Testsuppe"');
    expect(html).toContain('value="0:20"');
    expect(html).toMatch(/<textarea[^>]*name="ingredients"[^>]*>Salz<\/textarea>/);
    expect(html).toMatch(/value="Suppe" checked/);
    expect(html).toMatch(/value="Backen" checked/);
    expect(html).toMatch(/value="Chefkoch" selected/);
    expect(html).toContain('href="/back"');
  });

  it('keeps "Sichern" enabled without JS; the name field is required instead', () => {
    const html = renderToString(<RecipeForm isNew values={emptyFormValues()} cancelHref="/" />);
    expect(html).not.toContain('disabled');
    expect(html).toMatch(/name="title"[^>]*required/);
  });

  it('marks invalid fields with their message', () => {
    const html = renderToString(
      <RecipeForm isNew values={values} invalidFields={['workTime']} cancelHref="/" />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toMatch(/name="workTime"[^>]*aria-invalid="true"/);
    expect(html).toContain('Bitte als Stunden:Minuten');
  });

  it('says when saving failed', () => {
    const html = renderToString(<RecipeForm isNew values={values} saveFailed cancelHref="/" />);
    expect(html).toContain('Speichern hat nicht geklappt.');
  });
});

describe('RecipeForm, in the browser', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => {
    render(null, container);
    container.remove();
  });

  const field = (name: string) => container.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
  const save = () => container.querySelector<HTMLButtonElement>('button[type="submit"]')!;

  function type(input: HTMLInputElement, text: string) {
    act(() => {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  it('disables "Sichern" while the name is empty', () => {
    act(() => render(<RecipeForm isNew values={emptyFormValues()} cancelHref="/" />, container));
    expect(save().disabled).toBe(true);

    type(field('title'), 'Testsuppe');
    expect(save().disabled).toBe(false);

    type(field('title'), '  ');
    expect(save().disabled).toBe(true);
  });

  it('keeps what was typed in other fields when the name changes', () => {
    act(() => render(<RecipeForm isNew values={values} cancelHref="/" />, container));
    field('workTime').value = '1:30';

    type(field('title'), 'Andere Suppe');
    expect(field('workTime').value).toBe('1:30');
  });
});
