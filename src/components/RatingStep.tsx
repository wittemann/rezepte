// Card content of the last step of cooking mode: „Wie war’s?“ with five big stars and the level
// under them. A tap saves at once (useRating in CookingMode). For a recipe without a photo, the
// photo question comes as `children` on the same card, so it isn't a second chore.
import type { ComponentChildren } from 'preact';
import type { Rating } from '../lib/recipes/fields.ts';
import RatingStars from './RatingStars.tsx';
import { TEXT as STARS_TEXT } from './RatingStars.texts.ts';
import styles from './RatingStep.module.css';
import { TEXT } from './RatingStep.texts.ts';

type Props = {
  rating: Rating | undefined;
  onPick: (value: Rating) => void;
  /** The photo question, for a recipe without a photo */
  children?: ComponentChildren;
};

export default function RatingStep({ rating, onPick, children }: Props) {
  return (
    <>
      <p class={styles.title}>{children ? TEXT.titleWithPhoto : TEXT.title}</p>
      <p class={styles.hint}>{TEXT.hint}</p>
      <RatingStars rating={rating} onPick={onPick} variant="cooking" />
      <p class={rating ? styles.level : `${styles.level} ${styles.unrated}`} aria-live="polite">
        {rating ? STARS_TEXT.levels[rating] : TEXT.unrated}
      </p>
      {children && <div class={styles.photo}>{children}</div>}
    </>
  );
}
