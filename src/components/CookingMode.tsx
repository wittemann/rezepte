// Cooking mode (design/README.md, "Kochmodus"): one step at a time with Maulti, progress dots
// and the ingredients in a sheet, without tab bar. The last step asks for the rating, and for a
// photo if the recipe has none („Wie war’s?“). Usually opened on the recipe page by
// CookingLauncher; on its own page (/cook) when loaded directly.
import { useRef, useState } from 'preact/hooks';
import type { CookingStep } from '../lib/recipes/cooking-steps.ts';
import type { Rating } from '../lib/recipes/fields.ts';
import type { IngredientLine } from '../lib/recipes/ingredients.ts';
import {
  formatAmount,
  formatQuantity,
  scaleQuantity,
  servingsFactor,
} from '../lib/recipes/servings.ts';
import Icon from './Icon.tsx';
import BottomSheet from './BottomSheet.tsx';
import PhotoStep from './PhotoStep.tsx';
import RatingStep from './RatingStep.tsx';
import styles from './CookingMode.module.css';
import { TEXT } from './CookingMode.texts.ts';
import { TEXT as RATING_TEXT } from './RatingStep.texts.ts';
import Maulti from './Maulti.tsx';
import Toast from './Toast.tsx';
import { usePhotoUpload } from './use-photo-upload.ts';
import { useRating } from './use-rating.ts';
import { useWakeLock } from './use-wake-lock.ts';

/** How far a finger has to move sideways to count as a swipe (design/README.md, "Kochmodus") */
const SWIPE_THRESHOLD = 50;

type Props = {
  /** For the rating and the photo upload */
  recipeId: string;
  /** The recipe page, where the close button leads */
  recipeHref: string;
  /** Whether the recipe has a photo; without one, the last step also asks for a photo */
  hasPhoto: boolean;
  /** The recipe's rating when the page was rendered, preselected in the last step */
  rating?: Rating;
  steps: CookingStep[];
  ingredients: IngredientLine[];
  /** What the ingredient amounts are written for */
  servings?: number;
  /** Servings chosen on the recipe page; the ingredients sheet is scaled to them and names them */
  chosenServings?: number;
  /**
   * Set when opened on the recipe page: called instead of following the close and done links,
   * with whether a photo was added or the rating changed (then the recipe page is out of date)
   */
  onClose?: (recipeChanged: boolean) => void;
};

export default function CookingMode({
  recipeId,
  recipeHref,
  hasPhoto,
  rating: initialRating,
  steps,
  ingredients,
  servings,
  chosenServings = servings,
  onClose,
}: Props) {
  useWakeLock();
  const [stepIndex, setStepIndex] = useState(0);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const swipeStartRef = useRef<number>();
  const photo = usePhotoUpload(recipeId);
  const rating = useRating(recipeId, initialRating);
  const stepCount = steps.length + 1; // the cooking steps and „Wie war’s?“
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === stepCount - 1;
  const step = isLast ? undefined : steps[stepIndex];
  const factor = servings && chosenServings ? servingsFactor(chosenServings, servings) : 1;
  const label = step
    ? [TEXT.stepLabel(stepIndex + 1, steps.length), step.section].filter(Boolean).join(' · ')
    : RATING_TEXT.label;
  const finished = rating.rating !== undefined || photo.status === 'saved';

  function handleClose(event: MouseEvent) {
    if (!onClose) return; // a page of its own: the link loads the recipe page
    event.preventDefault();
    onClose(photo.status === 'saved' || rating.rating !== initialRating);
  }

  function goToPrevious() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  function goToNext() {
    setStepIndex((index) => Math.min(stepCount - 1, index + 1));
  }

  function handlePointerDown(event: PointerEvent) {
    // The ingredients sheet sits inside the page but isn't part of the swipe area
    if ((event.target as Element).closest('dialog')) return;
    swipeStartRef.current = event.clientX;
  }

  // Decided while the finger moves, not on release: iOS often ends a touch drag with
  // pointercancel instead of pointerup, and then the release never arrives
  function handlePointerMove(event: PointerEvent) {
    if (swipeStartRef.current === undefined) return;
    const distance = event.clientX - swipeStartRef.current;
    if (Math.abs(distance) < SWIPE_THRESHOLD) return;
    swipeStartRef.current = undefined;
    if (distance < 0) goToNext();
    else goToPrevious();
  }

  function endSwipe() {
    swipeStartRef.current = undefined;
  }

  return (
    // Swipes count anywhere on the page, not only on the step card
    <div
      class={styles.page}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endSwipe}
      onPointerCancel={endSwipe}
    >
      <header class={styles.header}>
        <a href={recipeHref} class={styles.close} aria-label={TEXT.close} onClick={handleClose}>
          <span aria-hidden="true">{TEXT.closeSymbol}</span>
        </a>
        <ol class={styles.progress} aria-label={TEXT.progress}>
          {Array.from({ length: stepCount }, (_, index) => (
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
        <Maulti {...maultiLook(step !== undefined, hasPhoto, rating.rating)} />
        <section class={styles.card}>
          <h1 class={styles.label}>{label}</h1>
          {step ? (
            <p class={styles.text}>{step.text}</p>
          ) : (
            <RatingStep rating={rating.rating} onPick={rating.pick}>
              {!hasPhoto && (
                <PhotoStep
                  status={photo.status}
                  previewUrl={photo.previewUrl}
                  onPick={photo.upload}
                />
              )}
            </RatingStep>
          )}
          {!isLast && <p class={styles.swipeHint}>{TEXT.swipeHint}</p>}
        </section>
      </main>

      <footer class={styles.footer}>
        <button
          type="button"
          class={styles.previous}
          aria-label={TEXT.previous}
          disabled={isFirst}
          onClick={goToPrevious}
        >
          <Icon name="back" size={22} strokeWidth={2.4} />
        </button>
        {isLast && photo.status === 'uploading' ? (
          // Leaving now would cut the upload off
          <button type="button" class={styles.next} disabled>
            {TEXT.done}
          </button>
        ) : isLast ? (
          <a href={recipeHref} class={styles.next} onClick={handleClose}>
            {finished ? TEXT.done : TEXT.skip}
          </a>
        ) : (
          <button type="button" class={styles.next} onClick={goToNext}>
            {TEXT.next}
          </button>
        )}
      </footer>

      <BottomSheet
        open={ingredientsOpen}
        onClose={() => setIngredientsOpen(false)}
        title={sheetTitle(chosenServings)}
      >
        <ul class={styles.list}>
          {ingredients.map((line) =>
            line.kind === 'heading' ? (
              <li class={styles.heading}>{line.text}</li>
            ) : (
              <li class={styles.item}>
                <span class={styles.amount}>
                  {line.quantity && formatQuantity(scaleQuantity(line.quantity, factor))}
                </span>
                <span class={styles.rest}>{line.quantity ? line.quantity.rest : line.text}</span>
              </li>
            ),
          )}
        </ul>
      </BottomSheet>
      <Toast message={rating.failed ? RATING_TEXT.error : null} onDone={rating.clearFailed} />
    </div>
  );
}

/**
 * Maulti cooks during the steps. On „Wie war’s?“ he tastes until the recipe is rated, then cheers;
 * with the photo question on the card he cheers from the start, a bit smaller.
 */
function maultiLook(cooking: boolean, hasPhoto: boolean, rating: Rating | undefined) {
  if (cooking) return { pose: 'cook', size: 150 } as const;
  if (!hasPhoto) return { pose: 'cheer', size: 120 } as const;
  return { pose: rating ? 'cheer' : 'taste', size: 150 } as const;
}

function sheetTitle(servings: number | undefined) {
  if (servings === undefined) return TEXT.ingredients;
  const unit = servings <= 1 ? TEXT.singleServing : TEXT.servings;
  return `${TEXT.ingredients} · ${formatAmount(servings)} ${unit}`;
}
