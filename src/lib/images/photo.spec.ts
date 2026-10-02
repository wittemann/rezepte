import { describe, expect, it } from 'vitest';
import { fitWithin } from './photo.ts';

describe('fitWithin', () => {
  it('shrinks the longer side to the maximum and keeps the proportions', () => {
    expect(fitWithin(4000, 3000, 1200)).toEqual({ width: 1200, height: 900 });
    expect(fitWithin(3000, 4000, 1200)).toEqual({ width: 900, height: 1200 });
  });

  it('never enlarges a small image', () => {
    expect(fitWithin(800, 600, 1200)).toEqual({ width: 800, height: 600 });
  });

  it('rounds to whole pixels', () => {
    expect(fitWithin(4001, 3001, 1200)).toEqual({ width: 1200, height: 900 });
  });
});
