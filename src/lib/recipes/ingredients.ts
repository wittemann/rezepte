// Parses the free-text "Zutaten" field into lines for display and the serving scaler.
// Format: "Data conventions" in docs/specs/03-data-model.md. Never fails: a line it
// doesn't understand becomes an item without quantity, shown as written.

export type IngredientLine =
  | { kind: 'heading'; text: string } // "Für den Teig:" → "Für den Teig"
  | { kind: 'item'; text: string; quantity?: Quantity }; // text = the whole line as written

export type Quantity = {
  min: number; // "2–3" → min 2, max 3
  max?: number;
  unit?: string; // one of UNITS, maybe with a size word: "g", "EL", "kleine Prise", …
  prefix?: QuantityPrefix; // "ca. 200 g" → "ca."
  rest: string; // the text after amount and unit: "Mehl (Type 550)"
};

export type QuantityPrefix = 'ca.' | 'knapp' | 'etwa';

/**
 * Words shown with the amount in the bold amount column ("250 g" | "Mehl"). The amount scales
 * either way; an unknown unit just stays in the rest ("2" | "Zweige Rosmarin").
 * The units used in the recipes (checked 2026-11-09).
 */
const UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'EL',
  'TL',
  'Päckchen',
  'Prise',
  'Prisen',
  'Tasse',
  'Becher',
  'Dose',
  'Dosen',
  'Glas',
  'Würfel',
  'Scheibe',
  'Scheiben',
  'Stiel',
  'Stiele',
  'Paar',
  'Fixpäckchen',
  'Bund',
  'Beutel',
  'Topf',
  'Schuss',
  'Spritzer',
  'Klecks',
  'Handvoll',
  'Zweige',
  'Stangen',
];

/** A size word that can stand between amount and unit: "1 kleine Prise", "1 großes Glas". */
const SIZE_WORD = /^(?:klein|groß)e[snr]?\s+/;

/** The fractions the amount column can show as ¼ ½ ¾ (`formatAmount`). */
const FRACTIONS: Record<string, number> = {
  '¼': 0.25,
  '½': 0.5,
  '¾': 0.75,
  '1/4': 0.25,
  '1/2': 0.5,
  '3/4': 0.75,
};
const FRACTION = Object.keys(FRACTIONS).join('|');

// One amount: a fraction, alone or after a whole number ("½", "1/2", "1 ½", "1½", "1 1/2"), a
// whole number or a decimal comma ("250", "1,5").
const AMOUNT = String.raw`(?:(?:\d+\s+|\d+(?=[¼½¾]))?(?:${FRACTION})|\d+(?:,\d+)?)`;

// A fraction that can't be read right after the amount: "1 1/3 TL", "1 ⅓ EL". Such a line isn't
// read at all, or only the whole number would scale ("2 ⅓ EL" for twice "1 ⅓ EL").
const NO_FRACTION_AFTER = String.raw`(?!\s*(?:\d+\/\d+|[¼½¾⅓⅔⅛]))`;

// Optional prefix, amount, optional range ("2–3", "2-3"), then the gap and the rest of the line.
const QUANTITY_LINE = new RegExp(
  String.raw`^(?:(ca\.|knapp|etwa)\s+)?(${AMOUNT})(?:\s*[–-]\s*(${AMOUNT}))?${NO_FRACTION_AFTER}(\s*)(.*)$`,
);

export function parseIngredients(text: string | undefined) {
  return (text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map(parseLine);
}

function parseLine(line: string) {
  if (line.endsWith(':')) return { kind: 'heading' as const, text: line.slice(0, -1).trim() };
  const quantity = parseQuantity(line);
  return quantity
    ? { kind: 'item' as const, text: line, quantity }
    : { kind: 'item' as const, text: line };
}

function parseQuantity(line: string) {
  const match = QUANTITY_LINE.exec(line);
  if (!match) return undefined;
  const [, prefix, minText, maxText, gap, afterAmount] = match;
  const unit = findUnit(afterAmount);
  // Without a space only a unit may follow ("250g"), so "3er Pack" is not read as an amount.
  if (!gap && afterAmount && !unit) return undefined;

  const quantity: Quantity = {
    min: amountValue(minText),
    rest: unit ? afterAmount.slice(unit.length).trim() : afterAmount,
  };
  if (maxText !== undefined) quantity.max = amountValue(maxText);
  if (unit) quantity.unit = unit;
  if (prefix) quantity.prefix = prefix as QuantityPrefix;
  return quantity;
}

/** The unit at the start of `text` as the amount column shows it ("tl" → "TL"), with a size word. */
function findUnit(text: string) {
  const sizeWord = SIZE_WORD.exec(text)?.[0] ?? '';
  const afterSizeWord = text.slice(sizeWord.length);
  const unit = UNITS.find((candidate) => startsWithWord(afterSizeWord, candidate));
  return unit && sizeWord + unit;
}

/** Whether `text` starts with `word` in any case, followed by a space or the end of the line. */
function startsWithWord(text: string, word: string) {
  const next = text[word.length];
  const isWholeWord = next === undefined || /\s/.test(next);
  return isWholeWord && text.slice(0, word.length).toLowerCase() === word.toLowerCase();
}

/** "1,5" → 1.5, "1/2" → 0.5, "1 ½" → 1.5 */
function amountValue(amount: string) {
  const fraction = Object.keys(FRACTIONS).find((candidate) => amount.endsWith(candidate));
  if (!fraction) return Number(amount.replace(',', '.'));
  const whole = amount.slice(0, -fraction.length).trim();
  return Number(whole) + FRACTIONS[fraction];
}
