// UI texts of the timers (design/README.md, "Timer")
export const TEXT = {
  /** " · Schritt 3", after the recipe title on the pill */
  pillStep: (stepNumber: number) => ` · Schritt ${stepNumber}`,
  cancel: 'Timer abbrechen',
  cancelSymbol: '✕',
  alarmTitle: 'Piep, piep! Zeit ist um.',
  /** "Beispielrezept, Schritt 3: 25 Minuten sind um." */
  alarmMessage: (recipeTitle: string, stepNumber: number, label: string) =>
    `${recipeTitle}, Schritt ${stepNumber}: ${label} sind um.`,
  acknowledge: 'Alles klar',
};
