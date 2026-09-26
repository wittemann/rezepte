import { describe, expect, it } from 'vitest';
import { safeNextPath } from './next-path.ts';

describe('safeNextPath', () => {
  it.each([
    ['/', '/'],
    ['/rezepte', '/rezepte'],
    ['/rezepte?q=Kn%C3%B6del', '/rezepte?q=Kn%C3%B6del'],
    ['/rezept/rec123#schritte', '/rezept/rec123#schritte'],
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
    'rezepte',
    ' /rezepte',
  ])('refuses anything that could lead to another site: %j', (next) => {
    expect(safeNextPath(next)).toBe('/');
  });
});
