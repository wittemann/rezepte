// Builds the plain text for "Rezept teilen" (ADR 0015): the recipe for someone without the
// password, sent through the share sheet. Parts in a fixed order, a blank line between them; a part
// without a value is left out. Plain text only, so it looks the same in every chat and mail app.

import type { IngredientLine } from './ingredients.ts';
import type { Method } from './method.ts';
import type { Recipe } from './recipe.ts';
import { formatAmount } from './servings.ts';
import { formatDuration } from './time.ts';

const TEXT = {
  singleServing: 'Portion',
  servings: 'Portionen',
  workTime: 'Arbeitszeit',
  totalTime: 'Gesamtzeit',
  ingredients: 'Zutaten',
  method: 'Zubereitung',
  notes: 'Notizen',
  source: 'Quelle',
};

export function buildShareText(recipe: Recipe) {
  const parts = [
    titlePart(recipe),
    ingredientsPart(recipe.ingredients),
    // Ideas (recipes without instructions) go out without steps
    recipe.hasInstructions ? methodPart(recipe.method) : undefined,
    notesPart(recipe.notes),
    sourcePart(recipe.source, recipe.sourceUrl),
  ];
  return parts.filter((part) => part !== undefined).join('\n\n');
}

/** Title, then "4 Portionen · Arbeitszeit 20 Min. · Gesamtzeit 1 Std." if any of them is set. */
function titlePart({ title, servings, workMinutes, totalMinutes }: Recipe) {
  const facts = [];
  if (servings !== undefined) {
    const unit = servings <= 1 ? TEXT.singleServing : TEXT.servings;
    facts.push(`${formatAmount(servings)} ${unit}`);
  }
  if (workMinutes !== undefined) facts.push(`${TEXT.workTime} ${formatDuration(workMinutes)}`);
  if (totalMinutes !== undefined) facts.push(`${TEXT.totalTime} ${formatDuration(totalMinutes)}`);
  return facts.length > 0 ? `${title}\n${facts.join(' · ')}` : title;
}

/** Items as written (original servings, not scaled), headings after a blank line. */
function ingredientsPart(ingredients: IngredientLine[]) {
  if (ingredients.length === 0) return undefined;
  const lines = [TEXT.ingredients];
  for (const line of ingredients) {
    if (line.kind === 'heading') lines.push('', `${line.text}:`);
    else lines.push(`- ${line.text}`);
  }
  return lines.join('\n');
}

/** Steps numbered through all sections, as on the recipe page; the hint after a blank line. */
function methodPart(method: Method) {
  const lines = [TEXT.method];
  let number = 0;
  for (const section of method.sections) {
    if (section.title) lines.push('', `${section.title}:`);
    for (const step of section.steps) {
      number += 1;
      lines.push(`${number}. ${step.text}`);
    }
  }
  if (method.hint) lines.push('', method.hint);
  // Nothing but the heading: no steps and no hint
  return lines.length > 1 ? lines.join('\n') : undefined;
}

function notesPart(notes: string | undefined) {
  const trimmed = notes?.trim();
  return trimmed ? `${TEXT.notes}\n${trimmed}` : undefined;
}

/** "Quelle: Chefkoch", the link on its own line so chat apps make it tappable. */
function sourcePart(source: string | undefined, sourceUrl: string | undefined) {
  if (source && sourceUrl) return `${TEXT.source}: ${source}\n${sourceUrl}`;
  if (source || sourceUrl) return `${TEXT.source}: ${source ?? sourceUrl}`;
  return undefined;
}
