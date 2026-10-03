import { describe, expect, it } from 'vitest';
import { safeNextPath } from './next-path.ts';

describe('safeNextPath', () => {
  it.each([
    ['/', '/'],
    ['/recipes', '/recipes'],
    ['/recipes?q=Kn%C3%B6del', '/recipes?q=Kn%C3%B6del'],
    ['/recipes/rec123#steps', '/recipes/rec123#steps'],
  ])('keeps the local path %j', (next, expected) => {
    expect(safeNextPath(next)).toBe(expected);
  });

  it.each([undefined, null, ''])('falls back to the start page without next: %j', (next) => {
    expect(safeNextPath(next)).toBe('/');
  });

  it.each([
    'https://evil.example/',
    'http://evil.example',
    '//evil.example',
    '///evil.example',
    '/\\evil.example',
    '/\t/evil.example',
    '/\n/evil.example',
    '//[',
    'javascript:alert(1)',
    'recipes',
    ' /recipes',
  ])('refuses anything that could lead to another site: %j', (next) => {
    expect(safeNextPath(next)).toBe('/');
  });

  it.each(['/login', '/login/', '/login?next=%2Frecipes'])(
    'never leads back to the login page: %j',
    (next) => {
      expect(safeNextPath(next)).toBe('/');
    },
  );
});
