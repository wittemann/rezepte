// UI texts of the favorites page (design/README.md, "Favoriten")
export const TEXT = {
  title: 'Favoriten',
  count: (recipeCount: number) => `${recipeCount} ${recipeCount === 1 ? 'Rezept' : 'Rezepte'}`,
  emptyTitle: 'Noch keine Favoriten',
  emptyText: 'Tippe in einem Rezept auf das Herz, dann erscheint es hier.',
};
