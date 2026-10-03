// UI texts of cooking mode (design/README.md, "Kochmodus")
export const TEXT = {
  close: 'Kochmodus beenden',
  closeSymbol: '✕',
  ingredients: 'Zutaten',
  singleServing: 'Portion',
  servings: 'Portionen',
  previous: 'Voriger Schritt',
  next: 'Weiter',
  done: 'Fertig',
  skip: 'Überspringen',
  swipeHint: 'Wischen für den nächsten Schritt',
  progress: 'Fortschritt',
  /** "Schritt 2 von 11" */
  stepLabel: (number: number, total: number) => `Schritt ${number} von ${total}`,
};
