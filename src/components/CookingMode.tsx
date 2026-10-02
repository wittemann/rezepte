// Cooking mode (design/README.md, "Kochmodus"): one step at a time with Maulti, progress dots
// and the ingredients in a sheet. A page of its own, without tab bar.
import { useState } from 'preact/hooks';
import type { CookingStep } from '../lib/recipes/cooking-steps.ts';
import type { IngredientLine } from '../lib/recipes/ingredients.ts';
import { formatAmount, formatQuantity, scaleQuantity } from '../lib/recipes/servings.ts';
import BottomSheet from './BottomSheet.tsx';
import styles from './CookingMode.module.css';
import { TEXT } from './CookingMode.texts.ts';
import Maulti from './Maulti.tsx';

type Props = {
  /** The recipe page, where the close button leads */
  recipeHref: string;
  steps: CookingStep[];
  ingredients: IngredientLine[];
  /** What the ingredient amounts are written for; shown in the title of the ingredients sheet */
  servings?: number;
};

export default function CookingMode({ recipeHref, steps, ingredients, servings }: Props) {
  const [stepIndex] = useState(0);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const step = steps[stepIndex];
  const label = [TEXT.stepLabel(stepIndex + 1, steps.length), step.section]
    .filter(Boolean)
    .join(' · ');

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <a href={recipeHref} class={styles.close} aria-label={TEXT.close}>
          <span aria-hidden="true">{TEXT.closeSymbol}</span>
        </a>
        <ol class={styles.progress} aria-label={TEXT.progress}>
          {steps.map((_, index) => (
            <li
              class={`${styles.dot} ${index <= stepIndex ? styles.reached : ''}`}
              aria-current={index === stepIndex ? 'step' : undefined}
            />
          ))}
        </ol>
        <button
          type="button"
          class={styles.ingredientsButton}
          onClick={() => setIngredientsOpen(true)}
        >
          {TEXT.ingredients}
        </button>
      </header>

      <main class={styles.main}>
        <Maulti pose="cook" size={150} />
        <section class={styles.card}>
          <p class={styles.label}>{label}</p>
          <p class={styles.text}>{step.text}</p>
        </section>
      </main>

      <BottomSheet
        open={ingredientsOpen}
        onClose={() => setIngredientsOpen(false)}
        title={sheetTitle(servings)}
      >
        <ul class={styles.list}>
          {ingredients.map((line) =>
            line.kind === 'heading' ? (
              <li class={styles.heading}>{line.text}</li>
            ) : (
              <li class={styles.item}>
                <span class={styles.amount}>
                  {line.quantity && formatQuantity(scaleQuantity(line.quantity, 1))}
                </span>
                <span class={styles.rest}>{line.quantity ? line.quantity.rest : line.text}</span>
              </li>
            ),
          )}
        </ul>
      </BottomSheet>
    </div>
  );
}

function sheetTitle(servings: number | undefined) {
  if (servings === undefined) return TEXT.ingredients;
  const unit = servings <= 1 ? TEXT.singleServing : TEXT.servings;
  return `${TEXT.ingredients} · ${formatAmount(servings)} ${unit}`;
}
