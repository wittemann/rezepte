// Parses the free-text "Zubereitung" field into sections, steps and a hint.
// Format: "Data conventions" in docs/specs/03-data-model.md; timer rule: design/README.md,
// "Regeln & Logik". Never fails: text it doesn't understand is kept as a step or in the hint.

export interface Method {
  sections: MethodSection[];
  hint?: string; // paragraphs after the last numbered step, one per line
}

export interface MethodSection {
  title?: string; // "Teig:" → "Teig"; no title for steps before the first heading
  steps: Step[];
}

export interface Step {
  text: string; // without the number: "1. Mehl sieben." → "Mehl sieben."
  timerMinutes?: number; // from the first time in the text: "1,5 Std." → 90
}

/** A paragraph or heading line, before sections and hint are sorted out. */
type Block =
  { kind: 'heading'; line: string } | { kind: 'paragraph'; text: string; numbered: boolean };

// "1. Mehl sieben." → "Mehl sieben.". A digit right after the dot is a decimal ("1.5 Std. …"),
// not a step number.
const NUMBERED_LINE = /^\d+\.(?!\d)\s*(.*)$/;

// One amount: whole number or decimal comma ("25", "1,5").
const AMOUNT = String.raw`\d+(?:,\d+)?`;

// A time like "25 Minuten", "1,5 Std." or "5–6 Minuten" (range: the first amount counts).
// Case-insensitive like the prototype, so "10 min." counts too. Not inside a number with a
// decimal point ("1.5 Std." gives no timer rather than 5 hours), not before further letters
// ("Minutenweise").
const TIME = new RegExp(
  String.raw`(?<!\d[.,]?)(${AMOUNT})(?:\s*[–-]\s*${AMOUNT})?\s*(Minuten|Minute|Min\.|Stunden|Stunde|Std\.)(?!\p{L})`,
  'iu',
);

export function parseMethod(text: string | undefined): Method {
  const blocks = splitBlocks(text ?? '');
  const lastNumbered = blocks.findLastIndex(
    (block) => block.kind === 'paragraph' && block.numbered,
  );
  // Without any numbered step, every paragraph is a step and there is no hint.
  if (lastNumbered === -1) return { sections: groupSections(blocks) };

  const method: Method = { sections: groupSections(blocks.slice(0, lastNumbered + 1)) };
  const hintBlocks = blocks.slice(lastNumbered + 1);
  // A heading after the last step ("Tipp:") stays in the hint as written, so it isn't lost.
  if (hintBlocks.length > 0) {
    method.hint = hintBlocks
      .map((block) => (block.kind === 'heading' ? block.line : block.text))
      .join('\n');
  }
  return method;
}

/**
 * Lines into blocks. A paragraph ends at a blank line, a heading or a numbered line; other lines
 * continue it, joined with a space (a line break inside a step). Text before the first numbered
 * step is kept as an unnumbered step.
 */
function splitBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let previousLineBlank = true;
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    const numbered = NUMBERED_LINE.exec(line);
    const previous = blocks.at(-1);

    if (line === '') {
      // Nothing to add; just remember that the paragraph ended.
    } else if (numbered) {
      blocks.push({ kind: 'paragraph', text: numbered[1], numbered: true });
    } else if (line.endsWith(':')) {
      blocks.push({ kind: 'heading', line });
    } else if (!previousLineBlank && previous?.kind === 'paragraph') {
      previous.text = previous.text === '' ? line : `${previous.text} ${line}`;
    } else {
      blocks.push({ kind: 'paragraph', text: line, numbered: false });
    }
    previousLineBlank = line === '';
  }
  return blocks;
}

/** Blocks into sections: each heading starts one, steps before the first heading get none. */
function groupSections(blocks: Block[]): MethodSection[] {
  const sections: MethodSection[] = [];
  for (const block of blocks) {
    if (block.kind === 'heading') {
      sections.push({ title: block.line.slice(0, -1).trim(), steps: [] });
      continue;
    }
    let current = sections.at(-1);
    if (!current) {
      current = { steps: [] };
      sections.push(current);
    }
    current.steps.push(parseStep(block.text));
  }
  return sections;
}

function parseStep(text: string): Step {
  const timerMinutes = findTimerMinutes(text);
  return timerMinutes ? { text, timerMinutes } : { text };
}

/**
 * Minutes of the first time in the text; a step gets at most one timer, later times are ignored.
 * Not rounded to whole minutes ("2,5 Minuten" → 2.5), only to whole seconds to drop floating
 * point noise. "0 Minuten" gives no timer.
 */
function findTimerMinutes(text: string): number | undefined {
  const match = TIME.exec(text);
  if (!match) return undefined;
  const [, amountText, unit] = match;
  const amount = Number(amountText.replace(',', '.'));
  const minutes = unit.toLowerCase().startsWith('st') ? amount * 60 : amount;
  const roundedToSeconds = Math.round(minutes * 60) / 60;
  return roundedToSeconds > 0 ? roundedToSeconds : undefined;
}
