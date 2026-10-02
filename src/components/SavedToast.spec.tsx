// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, it } from 'vitest';
import SavedToast from './SavedToast.tsx';

const container = document.createElement('div');

afterEach(() => render(null, container));

it('shows "Gespeichert" and takes the marker out of the URL', () => {
  history.replaceState(null, '', '/rezepte/recTest1?gespeichert');
  act(() => render(<SavedToast />, container));

  expect(container.textContent).toBe('Gespeichert');
  expect(location.pathname + location.search).toBe('/rezepte/recTest1');
});
