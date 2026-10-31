// „Auf die Einkaufsliste“ below the ingredients (design/README.md, "9. Einkaufsliste"): opens a
// sheet with every ingredient line checked, the user unchecks what's at home and sends the rest
// to the family's Bring list through the addToBring action (docs/decisions/0014-bring-shopping-list.md).
// Nothing is remembered: every opening starts with all lines checked.
import { actions } from 'astro:actions';
import { useState } from 'preact/hooks';
import type { IngredientLine } from '../lib/recipes/ingredients.ts';
import {
  formatAmount,
  formatQuantity,
  scaleQuantity,
  servingsFactor,
} from '../lib/recipes/servings.ts';
import BottomSheet from './BottomSheet.tsx';
import Toast from './Toast.tsx';
import styles from './BringButton.module.css';
import { TEXT } from './BringButton.texts.ts';

type Props = {
  recipeId: string;
  ingredients: IngredientLine[];
  /** Servings chosen with the stepper; missing → amounts as written */
  servings?: number;
  /** What the amounts are written for */
  baseServings?: number;
};

/** Positions of all lines that can go on the list (headings can't). */
function itemIndexes(ingredients: IngredientLine[]) {
  return ingredients.flatMap((line, index) => (line.kind === 'item' ? [index] : []));
}

export default function BringButton({ recipeId, ingredients, servings, baseServings }: Props) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const allIndexes = itemIndexes(ingredients);
  const factor = servings && baseServings ? servingsFactor(servings, baseServings) : 1;

  function openSheet() {
    setPicked(allIndexes);
    setFailed(false);
    setOpen(true);
  }

  function toggle(index: number) {
    setPicked((current) =>
      current.includes(index) ? current.filter((other) => other !== index) : [...current, index],
    );
  }

  async function send() {
    setSending(true);
    setFailed(false);
    // In list order, as on the page
    const lines = allIndexes.filter((index) => picked.includes(index));
    const { error } = await actions.addToBring({ id: recipeId, servings, lines });
    setSending(false);
    if (error) {
      setFailed(true);
      return;
    }
    setOpen(false);
    setMessage(TEXT.added(lines.length));
  }

  function hint() {
    if (!servings) return TEXT.hint;
    const amount = formatAmount(servings);
    return servings <= 1 ? TEXT.hintWithOneServing(amount) : TEXT.hintWithServings(amount);
  }

  function submitLabel() {
    if (sending) return TEXT.sending;
    if (picked.length === 0) return TEXT.nothing;
    if (failed) return TEXT.retry;
    return TEXT.submit(picked.length);
  }

  return (
    <>
      <button type="button" class={styles.open} aria-haspopup="dialog" onClick={openSheet}>
        <svg class={styles.cart} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M3.5 4.5h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h7.9a1.5 1.5 0 0 0 1.5-1.1l1.6-6.3H7M10 20.2h.01M17 20.2h.01" />
        </svg>
        {TEXT.open}
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={TEXT.title}>
        <div class={styles.content}>
          <p class={styles.hint}>{hint()}</p>
          <div class={styles.toolbar}>
            <span class={styles.count} aria-live="polite">
              {TEXT.count(picked.length, allIndexes.length)}
            </span>
            <button
              type="button"
              class={styles.textButton}
              disabled={sending}
              onClick={() => setPicked(allIndexes)}
            >
              {TEXT.all}
            </button>
            <button
              type="button"
              class={styles.textButton}
              disabled={sending}
              onClick={() => setPicked([])}
            >
              {TEXT.none}
            </button>
          </div>
          <ul class={sending ? `${styles.list} ${styles.busy}` : styles.list}>
            {ingredients.map((line, index) =>
              line.kind === 'heading' ? (
                <li key={index} class={styles.heading}>
                  {line.text}
                </li>
              ) : (
                <li key={index}>
                  <label class={styles.row}>
                    <input
                      type="checkbox"
                      class={styles.checkbox}
                      checked={picked.includes(index)}
                      disabled={sending}
                      onChange={() => toggle(index)}
                    />
                    <span class={styles.amount}>
                      {line.quantity && formatQuantity(scaleQuantity(line.quantity, factor))}
                    </span>
                    <span class={styles.rest}>
                      {line.quantity ? line.quantity.rest : line.text}
                    </span>
                  </label>
                </li>
              ),
            )}
          </ul>
          <div class={styles.footer}>
            {failed && (
              <p class={styles.error} role="alert">
                {TEXT.error}
              </p>
            )}
            <button
              type="button"
              class={styles.submit}
              disabled={sending || picked.length === 0}
              aria-busy={sending}
              onClick={send}
            >
              {sending && <span class={styles.spinner} aria-hidden="true" />}
              {submitLabel()}
            </button>
          </div>
        </div>
      </BottomSheet>
      <Toast message={message} onDone={() => setMessage(null)} />
    </>
  );
}
