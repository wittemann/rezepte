// UI texts of „Rezept löschen“ on the edit page and its confirmation sheet (no design; see
// docs/specs/05-design-integration.md)
export const TEXT = {
  open: 'Rezept löschen',
  title: 'Rezept löschen?',
  question: (title: string) =>
    `„${title}“ ist dann für alle weg. Das lässt sich nicht rückgängig machen.`,
  confirm: 'Löschen',
  deleting: 'Wird gelöscht …',
  cancel: 'Abbrechen',
  error: 'Das hat nicht geklappt. Bitte versuch es noch mal.',
};
