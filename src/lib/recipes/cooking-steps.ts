// The steps of a recipe as one flat list for cooking mode, one card per step.

import type { Method } from './method.ts';

export type CookingStep = {
  text: string;
  section?: string; // shown next to the step number: "Schritt 2 von 11 · Teig"
};

export function cookingSteps(method: Method) {
  return method.sections.flatMap((section) =>
    section.steps.map((step) => ({ ...step, section: section.title })),
  );
}
