// The ingredient list of a recipe. With a base number of servings it has a stepper that scales all
// amounts (rules: lib/recipes/servings.ts); without, the amounts stay as written.
import { useState } from 'preact/hooks';
import type { IngredientLine } from '../lib/recipes/ingredients.ts';
import {
  MIN_SERVINGS,
  formatAmount,
  formatQuantity,
  nextServings,
  previousServings,
  scaleQuantity,
  servingsFactor,
} from '../lib/recipes/servings.ts';
import styles from './Ingredients.module.css';
import { TEXT } from './Ingredients.texts.ts';

type Props = {
  ingredients: IngredientLine[];
  /** What the amounts are written for; missing → no stepper */
  servings?: number;
};

export default function Ingredients({ ingredients, servings: baseServings }: Props) {
  const [chosenServings, setChosenServings] = useState(baseServings);
  const factor = baseServings && chosenServings ? servingsFactor(chosenServings, baseServings) : 1;

  return (
    <section class={styles.section}>
      <div class={styles.header}>
        <h2 class={styles.title}>{TEXT.title}</h2>
        {chosenServings !== undefined && (
          <div class={styles.stepper}>
            <button
              type="button"
              class={styles.stepperButton}
              aria-label={TEXT.fewerServings}
              disabled={chosenServings <= MIN_SERVINGS}
              onClick={() => setChosenServings(previousServings(chosenServings))}
            >
              −
            </button>
            <div class={styles.servings} aria-live="polite">
              <span class={styles.servingsNumber}>{formatAmount(chosenServings)}</span>
              <span class={styles.servingsUnit}>
                {chosenServings <= 1 ? TEXT.singleServing : TEXT.servings}
              </span>
            </div>
            <button
              type="button"
              class={`${styles.stepperButton} ${styles.more}`}
              aria-label={TEXT.moreServings}
              onClick={() => setChosenServings(nextServings(chosenServings))}
            >
              +
            </button>
          </div>
        )}
      </div>
      <ul class={styles.card}>
        {ingredients.map((line) =>
          line.kind === 'heading' ? (
            <li class={styles.heading}>{line.text}</li>
          ) : (
            <li class={styles.item}>
              {line.quantity ? (
                <>
                  <span class={styles.amount}>
                    {formatQuantity(scaleQuantity(line.quantity, factor))}
                  </span>
                  <span class={styles.rest}>{line.quantity.rest}</span>
                </>
              ) : (
                <>
                  <span class={styles.amount} />
                  <span class={styles.rest}>{line.text}</span>
                </>
              )}
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
