// UI texts of cooking mode (design/README.md, "Kochmodus")
export const TEXT = {
  close: 'Kochmodus beenden',
  closeSymbol: '✕',
  ingredients: 'Zutaten',
  singleServing: 'Portion',
  servings: 'Portionen',
  progress: 'Fortschritt',
  /** "Schritt 2 von 11" */
  stepLabel: (number: number, total: number) => `Schritt ${number} von ${total}`,
};
