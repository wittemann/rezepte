// UI texts of „Auf die Einkaufsliste“ and its sheet (design/README.md, "9. Einkaufsliste")
export const TEXT = {
  open: 'Auf die Einkaufsliste',
  title: 'Auf die Einkaufsliste',
  hint: 'Nimm raus, was du schon zu Hause hast.',
  hintWithServings: (servings: string) =>
    `Für ${servings} Portionen. Nimm raus, was du schon zu Hause hast.`,
  hintWithOneServing: (servings: string) =>
    `Für ${servings} Portion. Nimm raus, was du schon zu Hause hast.`,
  count: (picked: number, total: number) => `${picked} von ${total} ausgewählt`,
  all: 'Alle',
  none: 'Keine',
  submit: (count: number) =>
    count === 1 ? '1 Zutat zu Bring! hinzufügen' : `${count} Zutaten zu Bring! hinzufügen`,
  nothing: 'Nichts ausgewählt',
  sending: 'Wird hinzugefügt …',
  retry: 'Noch mal versuchen',
  error: 'Bring! ist gerade nicht erreichbar. Deine Auswahl bleibt, versuch es gleich noch mal.',
  added: (count: number) =>
    count === 1
      ? '1 Zutat ist auf der Einkaufsliste.'
      : `${count} Zutaten sind auf der Einkaufsliste.`,
};
