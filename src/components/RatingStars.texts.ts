// UI texts of the rating stars (design/README.md, "8. Bewertung")
export const TEXT = {
  groupRated: (rating: number) => `Bewertung: ${rating} von 5 Sternen`,
  groupUnrated: 'Bewertung: noch keine',
  star: (value: number) => (value === 1 ? '1 Stern' : `${value} Sterne`),
  /** The line under the stars, one per rating */
  levels: { 1: 'Naja', 2: 'Ganz okay', 3: 'Gut', 4: 'Richtig gut', 5: 'Mega lecker!' },
};
