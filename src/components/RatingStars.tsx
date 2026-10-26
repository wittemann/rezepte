// The five stars to rate a recipe with (design/README.md, "8. Bewertung"): one choice for screen
// readers (a radiogroup), each star a button. Picking a star is up to the caller (useRating), so
// it also decides what tapping the selected star again does (remove the rating).
// In cooking mode a newly picked star hops once (only without prefers-reduced-motion, in the CSS).
import { useState } from 'preact/hooks';
import { RATINGS, type Rating } from '../lib/recipes/fields.ts';
import Star from './Star.tsx';
import styles from './RatingStars.module.css';
import { TEXT } from './RatingStars.texts.ts';

// Header card: 30px stars in 44px targets on the pastel card. Cooking mode: 44px stars in 56px
// targets on a surface card.
const VARIANTS = {
  header: { size: 30, strokeWidth: 1.8, empty: 'emptyOnPastel' },
  cooking: { size: 44, strokeWidth: 1.7, empty: 'emptyOnSurface' },
} as const;

type Props = {
  rating: Rating | undefined;
  onPick: (value: Rating) => void;
  variant: keyof typeof VARIANTS;
};

export default function RatingStars({ rating, onPick, variant }: Props) {
  const { size, strokeWidth, empty } = VARIANTS[variant];
  const [hopping, setHopping] = useState<Rating>();

  function pick(value: Rating) {
    if (variant === 'cooking' && value !== rating) setHopping(value);
    onPick(value);
  }

  return (
    <div
      role="radiogroup"
      aria-label={rating ? TEXT.groupRated(rating) : TEXT.groupUnrated}
      class={`${styles.group} ${styles[variant]}`}
    >
      {RATINGS.map((value) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={value === rating}
          aria-label={TEXT.star(value)}
          class={value === hopping ? `${styles.button} ${styles.hop}` : styles.button}
          onClick={() => pick(value)}
          onAnimationEnd={() => setHopping(undefined)}
        >
          <Star
            size={size}
            strokeWidth={strokeWidth}
            look={rating !== undefined && value <= rating ? 'filled' : empty}
          />
        </button>
      ))}
    </div>
  );
}
