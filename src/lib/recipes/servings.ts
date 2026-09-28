// Serving scaler: scales ingredient amounts to the chosen number of servings and formats them
// for the bold amount column. Rules: design/README.md, "Regeln & Logik" and "4. Rezept-Detail".

import type { Quantity } from './ingredients.ts';

/** The stepper can't go below half a serving. */
export const MIN_SERVINGS = 0.5;

/** Below this, the stepper moves in ½ steps; from here on in whole steps. */
const WHOLE_STEPS_FROM = 2;

/** Scaled amounts from here on are rounded to whole numbers ("237,5 g" → "238 g"). */
const WHOLE_AMOUNTS_FROM = 20;

const QUARTER_SIGNS: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

/** Factor for all amounts: 2 servings of a recipe written for 4 → 0.5. `baseServings` must be > 0. */
export function servingsFactor(chosenServings: number, baseServings: number): number {
  return chosenServings / baseServings;
}

/** Stepper "+": ½ steps below 2 servings (½ → 1 → 1½ → 2), whole steps from there. */
export function nextServings(servings: number): number {
  return servings < WHOLE_STEPS_FROM ? servings + 0.5 : servings + 1;
}

/**
 * Stepper "−": the reverse of `nextServings`, never below ½. Whole steps stop at 2, so an odd
 * base like 2,5 servings still reaches the ½ steps.
 */
export function previousServings(servings: number): number {
  if (servings > WHOLE_STEPS_FROM) return Math.max(WHOLE_STEPS_FROM, servings - 1);
  return Math.max(MIN_SERVINGS, servings - 0.5);
}

/** The quantity with min and max scaled and rounded. Unit, prefix and rest stay as they are. */
export function scaleQuantity(quantity: Quantity, factor: number): Quantity {
  const scaled: Quantity = { ...quantity, min: scaleAmount(quantity.min, factor) };
  if (quantity.max !== undefined) {
    const max = scaleAmount(quantity.max, factor);
    // "1–1,2" halved would read "½–½": show just "½".
    if (max === scaled.min) delete scaled.max;
    else scaled.max = max;
  }
  return scaled;
}

/**
 * One amount times the factor, rounded for the kitchen: ≥ 20 to whole numbers, else to ¼.
 * Factor 1 keeps the amount exactly as written (no "0,3 TL" → "¼ TL" on the original recipe).
 * A small amount that would round to 0 is kept to one decimal, at least 0,1, so it doesn't vanish.
 */
export function scaleAmount(amount: number, factor: number): number {
  if (factor === 1) return amount;
  const scaled = amount * factor;
  if (scaled >= WHOLE_AMOUNTS_FROM) return Math.round(scaled);
  const quarters = Math.round(scaled * 4) / 4;
  if (quarters > 0) return quarters;
  return Math.max(0.1, Math.round(scaled * 10) / 10);
}

/**
 * An amount for display in German: whole and quarter values with ¼ ½ ¾ ("1½", "¾", "250"),
 * anything else with a decimal comma ("0,3", "22,3"), as in unscaled or tiny amounts.
 */
export function formatAmount(amount: number): string {
  const whole = Math.floor(amount);
  const quarterSign = QUARTER_SIGNS[amount - whole];
  if (amount === whole) return String(whole);
  if (quarterSign) return (whole > 0 ? String(whole) : '') + quarterSign;
  // Round away floating point noise like 0.30000000000000004.
  return String(Math.round(amount * 1000) / 1000).replace('.', ',');
}

/** The bold amount column: prefix, amount or range with en dash, unit ("ca. 1½–2 EL"). */
export function formatQuantity(quantity: Quantity): string {
  const amounts =
    quantity.max === undefined
      ? formatAmount(quantity.min)
      : `${formatAmount(quantity.min)}–${formatAmount(quantity.max)}`;
  return [quantity.prefix, amounts, quantity.unit].filter(Boolean).join(' ');
}
