import { describe, expect, it } from 'vitest';
import { cookingSteps } from './cooking-steps.ts';
import { parseMethod } from './method.ts';

describe('cookingSteps', () => {
  it('flattens the sections and tags each step with its section', () => {
    const method = parseMethod('1. Vorbereiten.\nTeig:\n2. Kneten.\n3. 10 Minuten ruhen lassen.');
    expect(cookingSteps(method)).toEqual([
      { text: 'Vorbereiten.', section: undefined },
      { text: 'Kneten.', section: 'Teig' },
      { text: '10 Minuten ruhen lassen.', section: 'Teig', timerMinutes: 10 },
    ]);
  });

  it('is empty without steps', () => {
    expect(cookingSteps(parseMethod(''))).toEqual([]);
  });
});
