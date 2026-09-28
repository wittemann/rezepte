import { describe, expect, it } from 'vitest';
import { parseMethod } from './method.ts';

/** The timer of a single step. */
function timerOf(stepText: string): number | undefined {
  return parseMethod(`1. ${stepText}`).sections[0].steps[0].timerMinutes;
}

describe('parseMethod', () => {
  it('returns no sections for empty or missing text', () => {
    expect(parseMethod(undefined)).toEqual({ sections: [] });
    expect(parseMethod('')).toEqual({ sections: [] });
    expect(parseMethod(' \n\n  ')).toEqual({ sections: [] });
  });

  it('reads numbered steps without their numbers', () => {
    expect(parseMethod('1. Wasser kochen.\n\n2. Nudeln hineingeben.')).toEqual({
      sections: [{ steps: [{ text: 'Wasser kochen.' }, { text: 'Nudeln hineingeben.' }] }],
    });
  });

  it('starts a new step at a numbered line even without a blank line', () => {
    const method = parseMethod('1. Wasser kochen.\n2. Nudeln hineingeben.');
    expect(method.sections[0].steps.map((step) => step.text)).toEqual([
      'Wasser kochen.',
      'Nudeln hineingeben.',
    ]);
  });

  it('joins further lines of a paragraph into its step', () => {
    const method = parseMethod('1. Wasser kochen\n  und salzen.\n\n2. Nudeln hineingeben.');
    expect(method.sections[0].steps.map((step) => step.text)).toEqual([
      'Wasser kochen und salzen.',
      'Nudeln hineingeben.',
    ]);
  });

  it('reads a step whose text starts on the line after the number', () => {
    expect(parseMethod('1.\nWasser kochen.').sections[0].steps).toEqual([
      { text: 'Wasser kochen.' },
    ]);
  });

  it('groups steps into sections, with numbering restarting per section', () => {
    const text = 'Teig:\n1. Mehl sieben.\n2. Kneten.\n\nFüllung:\n1. Quark verrühren.';
    expect(parseMethod(text)).toEqual({
      sections: [
        { title: 'Teig', steps: [{ text: 'Mehl sieben.' }, { text: 'Kneten.' }] },
        { title: 'Füllung', steps: [{ text: 'Quark verrühren.' }] },
      ],
    });
  });

  it('keeps steps before the first heading in a section without title', () => {
    const method = parseMethod('1. Ofen vorheizen.\n\nTeig:\n2. Mehl sieben.');
    expect(method.sections).toEqual([
      { steps: [{ text: 'Ofen vorheizen.' }] },
      { title: 'Teig', steps: [{ text: 'Mehl sieben.' }] },
    ]);
  });

  it('keeps a heading without steps as an empty section', () => {
    expect(parseMethod('Teig:\nFüllung:\n1. Quark verrühren.').sections).toEqual([
      { title: 'Teig', steps: [] },
      { title: 'Füllung', steps: [{ text: 'Quark verrühren.' }] },
    ]);
  });

  it('starts a new step after a heading instead of continuing the step before it', () => {
    const method = parseMethod('1. Ofen vorheizen.\nTeig:\nMehl sieben.\n2. Kneten.');
    expect(method.sections).toEqual([
      { steps: [{ text: 'Ofen vorheizen.' }] },
      { title: 'Teig', steps: [{ text: 'Mehl sieben.' }, { text: 'Kneten.' }] },
    ]);
  });

  it('treats a numbered line ending in ":" as a step, not a heading', () => {
    expect(parseMethod('1. Alles verrühren:').sections).toEqual([
      { steps: [{ text: 'Alles verrühren:' }] },
    ]);
  });

  it('keeps paragraphs after the last numbered step as the hint', () => {
    const text = '1. Backen.\n\nSchmeckt auch kalt.\nMit Puderzucker bestäuben.\n\nHält 3 Tage.';
    expect(parseMethod(text)).toEqual({
      sections: [{ steps: [{ text: 'Backen.' }] }],
      hint: 'Schmeckt auch kalt. Mit Puderzucker bestäuben.\nHält 3 Tage.',
    });
  });

  it('keeps a heading after the last numbered step in the hint as written', () => {
    expect(parseMethod('1. Backen.\n\nTipp:\nSchmeckt auch kalt.')).toEqual({
      sections: [{ steps: [{ text: 'Backen.' }] }],
      hint: 'Tipp:\nSchmeckt auch kalt.',
    });
  });

  it('keeps unnumbered paragraphs before the last numbered step as steps', () => {
    const method = parseMethod('Vorab alles bereitlegen.\n\n1. Backen.');
    expect(method).toEqual({
      sections: [{ steps: [{ text: 'Vorab alles bereitlegen.' }, { text: 'Backen.' }] }],
    });
  });

  it('makes every paragraph a step when nothing is numbered', () => {
    expect(parseMethod('Alles verrühren.\n\nBacken.')).toEqual({
      sections: [{ steps: [{ text: 'Alles verrühren.' }, { text: 'Backen.' }] }],
    });
  });

  it('does not read a decimal at the start of a line as a step number', () => {
    expect(parseMethod('1.5 Liter Wasser kochen.').sections[0].steps[0].text).toBe(
      '1.5 Liter Wasser kochen.',
    );
  });
});

describe('parseMethod timers', () => {
  it.each([
    ['25 Minuten backen.', 25],
    ['1 Minute rühren.', 1],
    ['10 Min. ruhen lassen.', 10],
    ['1 Stunde gehen lassen.', 60],
    ['2 Stunden kühlen.', 120],
    ['2 Std. kühlen.', 120],
    ['1,5 Std. schmoren.', 90],
    ['2,5 Minuten rühren.', 2.5],
    ['Bei 180 °C etwa 25Minuten backen.', 25],
    ['10 min. ruhen lassen.', 10],
  ])('reads the time in "%s"', (stepText, minutes) => {
    expect(timerOf(stepText)).toBe(minutes);
  });

  it.each([
    ['5–6 Minuten braten.', 5],
    ['5-6 Minuten braten.', 5],
    ['1 – 2 Std. ziehen lassen.', 60],
    ['1,5–2 Std. schmoren.', 90],
  ])('uses the lower number of the range in "%s"', (stepText, minutes) => {
    expect(timerOf(stepText)).toBe(minutes);
  });

  it('uses only the first time in a step', () => {
    expect(timerOf('10 Minuten anbraten, dann 1 Stunde schmoren.')).toBe(10);
  });

  it.each([
    ['Auf 180 °C vorheizen.'],
    ['3 Eier verquirlen.'],
    ['10 Min ruhen lassen.'], // "Min." needs the dot
    ['Minutenweise nachsehen, 2 Minutenweise.'],
    ['1.5 Std. schmoren.'], // decimal point: no timer rather than 5 hours
    ['0 Minuten warten.'],
  ])('gives no timer for "%s"', (stepText) => {
    expect(timerOf(stepText)).toBeUndefined();
  });

  it('reads timers in unnumbered steps too, but not in the hint', () => {
    expect(parseMethod('5 Minuten rühren.\n\n1. Backen.\n\n20 Minuten abkühlen lassen.')).toEqual({
      sections: [{ steps: [{ text: '5 Minuten rühren.', timerMinutes: 5 }, { text: 'Backen.' }] }],
      hint: '20 Minuten abkühlen lassen.',
    });
  });
});
