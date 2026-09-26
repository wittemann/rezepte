# Handoff: Kochbuch-App „Maulti“ (Variante 5a · Verspielt/Sticker)

## Überblick
Responsive Web-App (Fokus iPhone, als PWA auf dem Homescreen) für das Familienkochbuch. Datenquelle ist eine Airtable-Base (`applSRjoVJrqAFQhT`, Tabelle „Rezepte“, ca. 95 Rezepte). Familie und Freunde sehen **und bearbeiten** dasselbe Kochbuch. Das Maskottchen **Maulti** (eine Maultasche) begleitet durch die App.

## Über die Design-Dateien
Die Dateien in diesem Paket sind **Design-Referenzen in HTML**: ein klickbarer Prototyp, der Aussehen und Verhalten zeigt. Sie sind **kein Produktionscode** zum Kopieren. Aufgabe ist, das Design in der Zielumgebung neu umzusetzen. Gibt es noch kein Projekt, empfiehlt sich z. B. **Next.js (App Router) + TypeScript** als PWA, mit serverseitigem Airtable-Zugriff (API-Token nie im Client).

Prototyp ansehen: `Kochbuch App.dc.html?variant=playful` direkt im Browser öffnen (benötigt `support.js` und `data/rezepte.json` daneben). Relevant ist nur der Zweig `isPlay` (Variante `playful`). Die übrigen Varianten (editorial, warm, minimal, future, playsoft, playcomic) waren Explorationen und sind **nicht** umzusetzen.

## Fidelity
**High-Fidelity.** Farben, Typografie, Abstände, Radien, Schatten und Interaktionen sind final. Das Maskottchen ist als SVG final (siehe `Maskottchen.dc.html`) und kann 1:1 als Komponente mit `pose`-Prop übernommen werden.

## Datenmodell (Airtable → App)
Felder aus Airtable (siehe `Rezepte-Grid view.csv`):

| Feld | Typ | Nutzung |
|---|---|---|
| Name | Text | Titel |
| Kategorie | Single Select | Hauptgericht, Beilage, Salat, Suppe, **Grillen** (neu), Dessert, Backen, Grundrezept |
| Portionen | Zahl | Basis für Portionsrechner; leer → kein Rechner |
| Arbeitszeit, Gesamtzeit | Dauer `h:mm` | Anzeige, Zeitfilter |
| Zutaten | Langtext | eine Zutat pro Zeile; Zeilen mit `:` am Ende = Zwischenüberschrift |
| Zubereitung | Langtext | Schritte `1.`, `2.` …; Zeilen mit `:` am Ende = Abschnitt (z. B. „Teig:“); Absätze nach dem letzten Schritt = Hinweis |
| Kalorien pro Portion | Zahl | Anzeige |
| Foto | Attachment | Bild; **Airtable-URLs laufen ab**: Bilder serverseitig cachen/proxen |
| Quelle, Original-Link | Text/URL | „von Chefkoch“ mit Link |
| Notizen | Langtext | aufklappbar |
| **Mahlzeit** (NEU anlegen) | Multi Select | `Frühstück`, `Mittag & Abend`, `Backen`. Vorschlag für alle Rezepte: `Mahlzeit-Zuordnung.csv` |

Rezepte ohne Zubereitung („Stubs“, z. B. „Käsespätzle“) sind Ideen. Sie werden gelistet und mit „Noch ohne Anleitung“ plus CTA „Rezept ergänzen“ angezeigt.

Schreiben: „Neu“, „Bearbeiten“ und Foto-Upload müssen nach Airtable zurückschreiben (im Prototyp nur localStorage). Favoriten sind **pro Gerät** (localStorage) ausreichend.

## Screens

### Tab-Leiste (unten, schwebend)
- `position: absolute; left/right 12px; bottom: safe-area + 12px; height 68px`, surface-Hintergrund, Rand `2.5px solid outline`, Radius 28, Schatten `0 4px 0 outline`.
- 4 gleich breite Tabs: **Start · Rezepte · Favoriten · Neu**. Icon 24px (Stroke 2.2), Label 12px/800, aktiver Tab: ink-Farbe + 5px Akzentpunkt darunter; Favoriten-Herz aktiv gefüllt.
- „Neu“ ist kein Zustand, sondern öffnet das Formular „Neues Rezept“.
- Inhalt scrollt mit `padding-bottom: 120px`.

### 1. Start
1. **Begrüßung:** Maulti (Pose `wave`, 104px) links, rechts Sprechblase (surface, Rand 2px outline, Radius `24 24 24 6`, Schatten `0 4px 0`). Zeile 1: „{Guten Morgen|Tag|Abend}! Ich bin Maulti.“ (14/700 muted). Zeile 2: Headline (Fredoka 22/600): Frühstück „Was frühstücken wir heute?“, Abend „Was kochen wir heute?“, Backen „Was backen wir heute?“.
2. **Mahlzeit-Kacheln:** 3-spaltiges Grid, Gap 10, Höhe 56, Radius 20, Pastellfarbe je Mahlzeit, Text Fredoka 16/600 in `#2b2118`. Aktiv: Rand 2.5px outline, Schatten `0 4px 0`, `translateY(-3px)`. Standard: vor 11 Uhr Frühstück, sonst Abend.
3. **„Wie viel Zeit?“:** Label 14/800 + Segmented Control (sunk-Hintergrund, Radius 22, Padding 3) mit „Wenig Zeit / bis 30 Min.“ (Backen: bis 90 Min.) und „Viel Zeit / auch Aufwendiges“. Aktiv: surface + Rand. Standard: Mo–Fr „Wenig Zeit“, Sa/So „Viel Zeit“. Darunter „N passende Rezepte“ (13/700 muted).
4. **Vorschläge:** horizontales Karussell (scroll-snap), bis zu 6 Karten, 262×min. 210, Radius 28, Rand 2.5px, Schatten `0 5px 0`, abwechselnd `rotate(-1.4deg)` / `rotate(1.4deg)`, Hintergrund = Pastell der Mahlzeit. Inhalt: Kategorie-Pill (weiß) + Zeit-Pill (outline-Hintergrund), Titel Fredoka 24/600, Button „Los geht’s →“. Am Ende eine gestrichelte Karte „↻ Nochmal würfeln“ (mischt neu). Auswahl: Rezepte mit passender Mahlzeit, bei „Wenig Zeit“ nur Gesamtzeit ≤ Limit (unbekannte Zeit zählt als passend), deterministisch gemischt nach Tag + Mahlzeit + Würfel-Seed. Leer: Maulti `think` + „Hmm, dazu finde ich nichts. Probier „Viel Zeit“.“
5. **Favoriten:** Überschrift Fredoka 19/600, rechts „Alle N anzeigen →“ (Akzent, öffnet den Favoriten-Tab). Max. 4 Zeilen (zuletzt markierte zuerst).
6. **Stöbern:** 3-spaltiges Grid mit Kategorie-Kreisen 84px (Pastell je Kategorie, Rand 2px, Schatten `0 3px 0`), darin ein Linien-Icon 36px; darunter Name (14/800) und „N Rezepte“ (12/700 muted). Tipp öffnet Rezepte-Tab mit Kategorie-Filter.

### Rezept-Zeile (wiederverwendet)
Surface, Rand 2px outline, Radius 22, Schatten `0 3px 0`, Padding `10 12 10 10`, Gap 12. Links 52×52 Radius 18: Foto oder Pastell-Kachel mit Anfangsbuchstaben (Fredoka 24). Mitte: Name Fredoka 16/600, Meta 13/600 muted („1 Std. 5 Min. · 4 Portionen“ bzw. „Noch ohne Anleitung“). Rechts ggf. gefülltes Herz.

### 2. Rezepte (Suche + Liste in einem)
- Titel „Rezepte“ (Fredoka 30/600) + „N Rezepte [gefunden]“.
- Suchfeld 56px, Radius 20, Rand + Schatten, Placeholder „Worauf hast du Lust?“, 17px (≥16px wegen iOS-Zoom). Sucht in Name **und** Zutaten.
- Zeile darunter: Mahlzeit-Segmented (Alle · Frühstück · Abend · Backen) + Button „Filter [n]“ (aktiv: Akzentfarbe).
- **Filter-Sheet** (Bottom Sheet, Radius 30): Kategorie-Chips, „Bis 30 Min.“, „Mit Anleitung“, „Zurücksetzen“, CTA „N Rezepte anzeigen“.
- Ohne Suchbegriff: gruppiert nach Kategorie (Überschrift + Anzahl-Badge), mit Suchbegriff: flache Trefferliste (Namenstreffer zuerst).
- Leer: Maulti `think`, „Nichts gefunden“.

### 3. Favoriten
Liste aller Favoriten. Leer: Maulti `sleep`, „Noch keine Favoriten“ / „Tippe in einem Rezept auf das Herz, dann erscheint es hier.“

### 4. Rezept-Detail
- **Kopfkarte:** Pastell der Kategorie, Margin 0 10, Radius 34, Rand 2.5px, Schatten `0 5px 0`. Runde weiße Buttons 46px: ← zurück; Herz; „Bearbeiten“. Optional Foto (200px, Radius 24). Kategorie-Pill, Titel Fredoka 28/600, „von {Quelle}“ (Link). Maulti (108px) unten rechts überlappend: `heart` wenn Favorit, sonst `wave`.
- **Meta-Sticker:** Arbeitszeit, Gesamtzeit, kcal/Portion.
- **Stub-Hinweis:** gestrichelt, Maulti `think`, „Hier fehlt noch die Anleitung. Magst du sie ergänzen?“ + Button.
- **Zutaten** mit Portionsrechner (− Zahl +, Buttons 44px). Schritte: unter 2 Portionen in ½-Schritten (min. ½), darüber ganze Schritte. Mengen skalieren (siehe Regeln unten).
- **„So geht’s“:** Schritt-Karten (Radius 22) mit Nummernkreis in Kategoriefarbe; Abschnittsüberschriften in Akzent. Enthält ein Schritt eine Zeitangabe → Chip „⏲ 25 Minuten · Timer“.
- Hinweis-Box (sunk), Notizen aufklappbar.
- Fester CTA unten: „Los, wir kochen!“ (62px, Akzent, Rand, Schatten).

### 5. Kochmodus
- Kopf: ✕, Fortschrittspunkte (10px), „Zutaten“ (öffnet Sheet mit skalierten Zutaten).
- Maulti `cook` (150px, Kochmütze + Löffel), darunter Karte: „Schritt 3 von 11 · {Abschnitt}“ (Akzent 13/800), Schritttext Fredoka 23/500, ggf. Button „25 Minuten · Timer starten“, Hinweis „Wischen für den nächsten Schritt“.
- **Wischen** links/rechts (Schwelle 50px) + Buttons ← / „Weiter“ („Fertig“ am Ende).
- Bildschirm bleibt an (Screen Wake Lock API).
- **Foto-Schritt:** Hat das Rezept kein Foto, folgt als letzter Schritt: Maulti `cheer`, „Juhu, geschafft! Machst du ein Foto für mich?“, Button „Foto aufnehmen“ (`<input type=file accept=image/* capture=environment>`), Bild auf max. 1200px verkleinern, hochladen, Button wird „Fertig“ bzw. „Überspringen“.

### 6. Timer
- Mehrere Timer parallel. Pille oben mittig (ink-Hintergrund): Restzeit `m:ss` (Fredoka 17), „{Rezept} · Schritt n“, ✕.
- Bei Ablauf: Overlay mit Maulti `alarm` (Wecker), „Piep, piep! Zeit ist um.“, „{Rezept}, Schritt n: 25 Minuten sind um.“, Button „Alles klar“; Vibration. Echte App: zusätzlich Ton + Web-Push/Notification, damit es auch bei gesperrtem iPhone klingelt (iOS 16.4+ PWA).

### 7. Rezept bearbeiten / neu
Kopf: Abbrechen · „Bearbeiten“/„Neues Rezept“ · Sichern (deaktiviert ohne Name). Felder: Name, Kategorie (Chips), Passt zu (Mehrfach: Frühstück/Abend/Backen), Portionen, Arbeitszeit, Gesamtzeit (`h:mm`), Zutaten (Hilfetext zu Überschriften), Zubereitung (Hilfetext zu 1., 2., …), Quelle, Link, Notizen. Inputs 16px+. Hinweis „Änderungen sind für alle in der Familie sichtbar.“ Toast „Gespeichert“.

### 0. Login (vor allen anderen Screens)
Zweck:
Einfacher Schutz für Familie und Freunde: ein gemeinsames Passwort, kein Benutzername.

#### Layout (iPhone, 390 × 844)
Vollbild, Hintergrund `bg`. Keine Tab-Leiste. Inhalt vertikal zentriert, Spalte mit Gap 14px, Padding 24px seitlich, unten `max(env(safe-area-inset-bottom), 10px)`.

1. **Maulti** 170 × 170, Pose `lock` (Vorhängeschloss in der rechten Hand, zwinkert). Bei falschem Passwort Pose `think`.
2. **Titel** „Unser Kochbuch“: Fredoka 32/600, zentriert, line-height 1.1.
3. **Text**, Nunito 16/600, Farbe `muted`, max-width 280, zentriert, line-height 1.45:
   - Standard: „Psst, nur für Familie und Freunde. Wie lautet das Passwort?“
   - Fehler: „Hmm, das Passwort stimmt nicht. Probier’s nochmal!“
4. **Passwortfeld** (volle Breite, 8px Abstand nach oben): Höhe 58, Radius 20, `surface`, Rand `2px solid outline` (bei Fehler `2.5px solid accent`), Schatten `0 3px 0 outline`, Padding `0 8 0 18`.
   - `<input type="password" autocomplete="current-password" placeholder="Passwort">`, Nunito 18/700, ohne Rahmen/Hintergrund.
   - Rechts Pill-Button „Zeigen“ / „Verbergen“ (44 hoch, Radius 22, `sunk`, 13/800), schaltet `type` zwischen password/text um.
5. **Button** „Reinlassen“ (`type="submit"`): volle Breite, Höhe 58, Radius 29, `accent` / Text `onAccent`, Rand `2.5px solid outline`, Schatten `0 4px 0 outline`, Fredoka 19/600.
6. **Hinweis** „Einmal eingeben, dann merkt sich dein iPhone das.“: 13/600 `muted`, zentriert.

Alles liegt in einem `<form>`, damit Enter/„Los“ auf der iOS-Tastatur absendet und der iOS-Passwortmanager das Feld erkennt.

#### Verhalten
- Absenden → Passwort **serverseitig** prüfen (z. B. Vergleich mit Env-Variable `FAMILY_PASSWORD`, gehashed). Nie im Client-Bundle speichern. (Im Prototyp nur Demo: „maultasche“.)
- Erfolg → langlebiges, httpOnly, secure Session-Cookie (z. B. 1 Jahr) → Weiterleitung auf Start. Alle Seiten und API-Routen (inkl. Airtable-Proxy und Bild-Upload) prüfen das Cookie, sonst Redirect auf /login.
- Fehler → Fehlertext + Pose `think` + Akzent-Rand. Beim Tippen zurück in den Normalzustand.
- Optional: Rate-Limit (z. B. 5 Versuche/Minute pro IP).
- Dark Mode folgt dem System (Tokens wie im Hauptpaket).

Referenz: `screenshots/00-login.png`, Grafik `maulti-login.svg`.

## Regeln & Logik
- **Mengen skalieren:** führende Menge parsen (`250`, `1,5`, `½ ¼ ¾`, `1/2`, Bereiche `2–3`, Präfixe `ca./knapp/etwa`) + Einheit (`g kg ml l cl dl EL TL Pck. Prise Tasse Becher Dose Stück Bund Zehe Scheibe Msp. Glas Würfel Tüte`). Faktor = gewählt / Basis. Ausgabe: ≥ 20 ganzzahlig, sonst auf ¼ gerundet mit ¼ ½ ¾. Zeilen ohne Menge („Salz, Pfeffer“) bleiben unverändert.
- **Zeitangabe im Schritt:** Regex auf `(\d+(,\d+)?)(–\d+)? (Minuten|Min.|Stunden|Std.)`, bei Bereichen zählt die untere Zahl.
- **Zeitformat:** `0:20` → „20 Min.“, `1:05` → „1 Std. 5 Min.“; kurz „20′“ / „1h05“.

## Design Tokens (Variante `playful`)
**Hell:** bg `#fff6e8` · surface `#ffffff` · sunk `#fbe9cf` · ink `#2b2118` · muted `#6e5e4f` · line `#eddcc3` · accent `oklch(0.56 0.17 30)` · onAccent `#ffffff` · outline `#2b2118`
**Dunkel** (folgt `prefers-color-scheme`, kein eigener Schalter): bg `#1f1826` · surface `#2b2233` · sunk `#362b40` · ink `#fbf3e6` · muted `#bcaec2` · line `#44394e` · accent `oklch(0.72 0.15 30)` · onAccent `#1f1826` · outline `#0c0910`
**Pastell:** `oklch(L 0.09 H)` mit L = 0.88 (hell) / 0.78 (dunkel); Text darauf immer `#2b2118`.
- Kategorie-Hues: Grillen 5 · Hauptgericht 30 · Dessert 335 · Backen 65 · Beilage 95 · Salat 145 · Suppe 205 · Grundrezept 265
- Mahlzeit-Hues: Frühstück 90 · Abend 25 · Backen 165
**Schrift:** Display „Fredoka“ 500/600, Text „Nunito“ 400–800 (Google Fonts). Mindestgröße 12px.
**Radien:** 16–20 (klein), 22 (Karten/Zeilen), 28–34 (große Karten/Sheets), 999 (Pills).
**Konturen/Schatten:** Rand 2px bzw. 2.5px `outline`; harte Schatten `0 3px 0` / `0 4px 0` / `0 5px 0` in `outline`.
**Abstände:** Seitenrand 16–20px, Gaps 8/10/12/14.
**Touch-Ziele:** min. 44px.

## Barrierefreiheit (offen)
- Schriftgrößen im Prototyp sind px. In der Umsetzung **rem** + iOS Dynamic Type verwenden (`font: -apple-system-body` auf `html`) und Layouts mit großer Schrift testen.
- Kontraste: Button-Texte auf Akzent ≥ 4.5:1 geprüft (hell: weiß auf L 0.56; dunkel: dunkel auf L 0.72).

## Assets
- `Maskottchen.dc.html`: Maulti als SVG (viewBox 120×120), Props `pose` (`wave | think | cook | cheer | sleep | heart | alarm | lock`), `size`, `accent`. Einsatz: Start `wave`, leere Suche/Stub `think`, leere Favoriten `sleep`, Detail `heart`/`wave`, Kochmodus `cook`, Foto-Schritt `cheer`, Timer-Ende `alarm`, Login `lock` (bei falschem Passwort `think`).
- `icon-180.png`: Apple-Touch-Icon (Maulti auf Pfirsich). Für die PWA zusätzlich 192/512px aus dem SVG erzeugen und ein `manifest.webmanifest` (Name „Kochbuch“, display `standalone`, theme `#fff6e8`) anlegen.
- Kategorie-Icons: einfache 24px-Linienpfade, siehe `CAT_ICON` in `Kochbuch App.dc.html`.

## Screenshots
`screenshots/` (390×844 @2x): 01 Start · 02 Start unten (Favoriten, Stöbern) · 03 Rezepte · 04 Filter-Sheet · 05 Favoriten · 06 Rezept-Detail · 07 Zutaten/Schritte · 08 Kochmodus mit Timer-Button · 09 Foto-Schritt · 10 Rezept ohne Anleitung · 11 Bearbeiten.

## Dateien
- `Kochbuch App.dc.html`: kompletter Prototyp (Logik im `<script data-dc-script>`: Parser, Vorschlagslogik, Timer, Portionsrechner). Relevant: Template-Zweig `isPlay` und das gemeinsame Bearbeiten-Formular.
- `Maskottchen.dc.html`: Maulti-Komponente.
- `Kochbuch Clickdummy.dc.html`: Präsentations-Canvas mit iPhone-Rahmen.
- `support.js`: Laufzeit für die Prototyp-Dateien (nicht übernehmen).
- `data/rezepte.json`: aus dem CSV aufbereitete Rezepte inkl. `mahlzeit`.
- `Rezepte-Grid view.csv`: Original-Export aus Airtable.
- `Mahlzeit-Zuordnung.csv`: vorgeschlagene Werte für das neue Feld „Mahlzeit“ und die Kategorie „Grillen“ zum Import in Airtable.
