// UI texts of the filter sheet (title, name of its button) and the "N Rezepte anzeigen" button (design/README.md, "Rezepte").
// The texts of the sheet's content are in pages/recipes/_index.texts.ts.
export const TEXT = {
  filter: 'Filter',
  /** Name of the button for screen readers; the visible number alone would read as "Filter2" */
  filterLabel: (activeCount: number) =>
    activeCount > 0 ? `Filter, ${activeCount} aktiv` : 'Filter',
  applyLabel: (recipeCount: number) =>
    `${recipeCount} ${recipeCount === 1 ? 'Rezept' : 'Rezepte'} anzeigen`,
};
