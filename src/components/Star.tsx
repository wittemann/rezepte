// The rating star (design/README.md, "8. Bewertung"; path from design/rating/*.dc.html, 24×24 grid).
// Filled: --star with a dark outline, in light and dark mode. Empty: on a pastel card or on a
// surface. Decorative: whoever shows stars says the rating in words for screen readers.
// Without a client:* directive Astro renders it to plain SVG, like Maulti.
import styles from './Star.module.css';

const PATH =
  'M12 2.6l2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 16.96l-5.62 2.94 1.07-6.27L2.9 9.2l6.3-.9z';

export type StarLook = 'filled' | 'emptyOnPastel' | 'emptyOnSurface';

type Props = {
  /** Width and height in px at default text size (design values: 14 rows, 30 header, 44 cooking) */
  size: number;
  /** Outline width on the 24×24 grid (design values: 2.2 at 14px, 1.8 at 30px, 1.7 at 44px) */
  strokeWidth: number;
  look?: StarLook;
};

export default function Star({ size, strokeWidth, look = 'filled' }: Props) {
  const sizeRem = `${size / 16}rem`;
  return (
    <svg
      viewBox="0 0 24 24"
      class={`${styles.star} ${styles[look]}`}
      style={{ width: sizeRem, height: sizeRem }}
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATH} stroke-width={strokeWidth} stroke-linejoin="round" />
    </svg>
  );
}
