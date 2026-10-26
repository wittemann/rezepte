// The rating in the recipe header card: five stars and a line under them with the level ("Gut")
// or an invitation to rate. Shared by everyone, saved in Airtable (useRating).
import type { Rating } from '../lib/recipes/fields.ts';
import RatingStars from './RatingStars.tsx';
import { TEXT as STARS_TEXT } from './RatingStars.texts.ts';
import Toast from './Toast.tsx';
import { useRating } from './use-rating.ts';
import styles from './RecipeRating.module.css';
import { TEXT } from './RecipeRating.texts.ts';

type Props = {
  recipeId: string;
  /** Rating when the page was rendered */
  rating: Rating | undefined;
};

export default function RecipeRating({ recipeId, rating: initialRating }: Props) {
  const { rating, pick, failed, clearFailed } = useRating(recipeId, initialRating);
  return (
    <div class={styles.rating}>
      <RatingStars rating={rating} onPick={pick} variant="header" />
      <p class={styles.caption} aria-live="polite">
        {rating ? STARS_TEXT.levels[rating] : TEXT.invite}
      </p>
      <Toast message={failed ? TEXT.error : null} onDone={clearFailed} />
    </div>
  );
}
