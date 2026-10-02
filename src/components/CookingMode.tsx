// Cooking mode (design/README.md, "Kochmodus"): one step at a time with Maulti, progress dots
// and the ingredients in a sheet. A page of its own, without tab bar.
import { useRef, useState } from 'preact/hooks';
import { formatTimerLabel } from '../lib/recipes/time.ts';
import { createTimer } from '../lib/timers/timers.ts';
import type { CookingStep } from '../lib/recipes/cooking-steps.ts';
import type { IngredientLine } from '../lib/recipes/ingredients.ts';
import { formatAmount, formatQuantity, scaleQuantity } from '../lib/recipes/servings.ts';
import Icon from './Icon.tsx';
import { addTimer } from './timer-store.ts';
import { unlockSound } from './timer-sound.ts';
import BottomSheet from './BottomSheet.tsx';
import PhotoStep from './PhotoStep.tsx';
import styles from './CookingMode.module.css';
import { TEXT } from './CookingMode.texts.ts';
import { TEXT as PHOTO_TEXT } from './PhotoStep.texts.ts';
import Maulti from './Maulti.tsx';
import { usePhotoUpload } from './use-photo-upload.ts';
import { useWakeLock } from './use-wake-lock.ts';

/** How far a finger has to move sideways to count as a swipe (design/README.md, "Kochmodus") */
const SWIPE_THRESHOLD = 50;

type Props = {
  /** For the photo upload */
  recipeId: string;
  /** Named on the timers started here */
  recipeTitle: string;
  /** The recipe page, where the close button leads */
  recipeHref: string;
  /** Whether the recipe has a photo; without one, a photo step follows the last step */
  hasPhoto: boolean;
  steps: CookingStep[];
  ingredients: IngredientLine[];
  /** What the ingredient amounts are written for; shown in the title of the ingredients sheet */
  servings?: number;
};

export default function CookingMode({
  recipeId,
  recipeTitle,
  recipeHref,
  hasPhoto,
  steps,
  ingredients,
  servings,
}: Props) {
  useWakeLock();
  const [stepIndex, setStepIndex] = useState(0);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const swipeStartRef = useRef<number>();
  // TEMPORARY: shows which touch/pointer events arrive on the phone (docs/bugs.md, swipe)
  const swipeLogRef = useRef<HTMLPreElement>(null);
  function logSwipe(entry: string) {
    const log = swipeLogRef.current;
    if (log) log.textContent = `${entry}\n${log.textContent ?? ''}`.slice(0, 400);
  }
  const photo = usePhotoUpload(recipeId);
  const stepCount = hasPhoto ? steps.length : steps.length + 1;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === stepCount - 1;
  const onPhotoStep = stepIndex === steps.length;
  const step = onPhotoStep ? undefined : steps[stepIndex];
  const label = step
    ? [TEXT.stepLabel(stepIndex + 1, steps.length), step.section].filter(Boolean).join(' · ')
    : PHOTO_TEXT.label;

  function startTimer(minutes: number) {
    // Starting is a tap, the one moment iOS lets the alarm sound be prepared
    unlockSound();
    addTimer(
      createTimer(
        {
          recipeTitle,
          stepNumber: stepIndex + 1,
          label: formatTimerLabel(minutes),
          minutes,
        },
        Date.now(),
      ),
    );
  }

  function goToPrevious() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  function goToNext() {
    setStepIndex((index) => Math.min(stepCount - 1, index + 1));
  }

  function handlePointerDown(event: PointerEvent) {
    logSwipe(`${event.type} ${event.pointerType} ${Math.round(event.clientX)}`);
    swipeStartRef.current = event.clientX;
  }

  // Decided while the finger moves, not on release: iOS often ends a touch drag with
  // pointercancel instead of pointerup, and then the release never arrives
  function handlePointerMove(event: PointerEvent) {
    if (swipeStartRef.current === undefined) return;
    const distance = event.clientX - swipeStartRef.current;
    logSwipe(`${event.type} ${Math.round(distance)}`);
    if (Math.abs(distance) < SWIPE_THRESHOLD) return;
    swipeStartRef.current = undefined;
    if (distance < 0) goToNext();
    else goToPrevious();
  }

  function endSwipe(event: Event) {
    logSwipe(event.type);
    swipeStartRef.current = undefined;
  }

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <a href={recipeHref} class={styles.close} aria-label={TEXT.close}>
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
        <Maulti pose={onPhotoStep ? 'cheer' : 'cook'} size={150} />
        <section
          class={styles.card}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endSwipe}
          onPointerCancel={endSwipe}
          onTouchStart={(event) => logSwipe(`${event.type} ${event.touches.length}`)}
          onTouchMove={(event) => logSwipe(event.type)}
          onTouchEnd={(event) => logSwipe(event.type)}
          onTouchCancel={(event) => logSwipe(event.type)}
        >
          <p class={styles.label}>{label}</p>
          {step ? (
            <>
              <p class={styles.text}>{step.text}</p>
              {step.timerMinutes !== undefined && (
                <button
                  type="button"
                  class={styles.timerButton}
                  onClick={() => startTimer(step.timerMinutes!)}
                >
                  <Icon name="timer" size={18} strokeWidth={2.2} />
                  {TEXT.startTimer(formatTimerLabel(step.timerMinutes))}
                </button>
              )}
            </>
          ) : (
            <PhotoStep status={photo.status} previewUrl={photo.previewUrl} onPick={photo.upload} />
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
          <a href={recipeHref} class={styles.next}>
            {onPhotoStep && photo.status !== 'saved' ? TEXT.skip : TEXT.done}
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
      <pre
        ref={swipeLogRef}
        style={{
          position: 'fixed',
          left: 8,
          top: 120,
          zIndex: 9,
          margin: 0,
          padding: 4,
          fontSize: 11,
          background: '#ff0',
          pointerEvents: 'none',
          whiteSpace: 'pre',
        }}
      />
    </div>
  );
}

function sheetTitle(servings: number | undefined) {
  if (servings === undefined) return TEXT.ingredients;
  const unit = servings <= 1 ? TEXT.singleServing : TEXT.servings;
  return `${TEXT.ingredients} · ${formatAmount(servings)} ${unit}`;
}
