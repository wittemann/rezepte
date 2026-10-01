// Parses the free-text "Zutaten" field into lines for display and the serving scaler.
// Format: "Data conventions" in docs/specs/03-data-model.md. Never fails: a line it
// doesn't understand becomes an item without quantity, shown as written.

export type IngredientLine =
  | { kind: 'heading'; text: string } // "Für den Teig:" → "Für den Teig"
  | { kind: 'item'; text: string; quantity?: Quantity }; // text = the whole line as written

export type Quantity = {
  min: number; // "2–3" → min 2, max 3
  max?: number;
  unit?: string; // one of UNITS: "g", "EL", …
  prefix?: QuantityPrefix; // "ca. 200 g" → "ca."
  rest: string; // the text after amount and unit: "Mehl (Type 550)"
};

export type QuantityPrefix = 'ca.' | 'knapp' | 'etwa';

/**
 * Words shown with the amount in the bold amount column ("250 g" | "Mehl"). The amount scales
 * either way; an unknown unit just stays in the rest ("2" | "Zweige Rosmarin").
 * The units used in the recipes (checked 2026-09-28).
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

// One amount: whole number or decimal comma ("250", "1,5"). Fractions like "½" or "1/2" aren't
// read (docs/specs/03-data-model.md), such lines are shown as written and not scaled.
const AMOUNT = String.raw`\d+(?:,\d+)?`;

// Optional prefix, amount, optional range ("2–3", "2-3"), then a space and the rest of the line.
// The space is required, so "3er Pack" is not read as an amount.
const QUANTITY_LINE = new RegExp(
  String.raw`^(?:(ca\.|knapp|etwa)\s+)?(${AMOUNT})(?:\s*[–-]\s*(${AMOUNT}))?(?:\s+(.*))?$`,
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
  const [, prefix, minText, maxText, afterAmount = ''] = match;
  const unit = findUnit(afterAmount);

  const quantity: Quantity = {
    min: amountValue(minText),
    rest: unit ? afterAmount.slice(unit.length).trim() : afterAmount,
  };
  if (maxText !== undefined) quantity.max = amountValue(maxText);
  if (unit) quantity.unit = unit;
  if (prefix) quantity.prefix = prefix as QuantityPrefix;
  return quantity;
}

/** The unit at the start of `text`, if it's followed by a space or the end of the line. */
function findUnit(text: string) {
  return UNITS.find(
    (unit) =>
      text.startsWith(unit) && (text.length === unit.length || /\s/.test(text[unit.length])),
  );
}

/** "1,5" → 1.5 */
function amountValue(amount: string) {
  return Number(amount.replace(',', '.'));
}
