// UI texts of the recipe row, from design/README.md ("Rezept-Zeile")
export const TEXT = {
  noInstructions: 'Noch ohne Anleitung',
  singleServing: 'Portion',
  servings: 'Portionen',
  favorite: 'Favorit',
  /** The stars at the start of the meta line, for screen readers */
  rating: (rating: number) => `${rating} von 5 Sternen`,
};
