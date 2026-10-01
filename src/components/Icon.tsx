// Line icons from the design prototype (ICONS and CAT_ICON in design/Kochbuch App.dc.html).
// All are drawn on a 24×24 grid. The color comes from the surrounding text (currentColor),
// so tab bar and category circles set it with CSS. Decorative: the label next to it says what it is.

const ICONS = {
  home: 'M4 10.5L12 4l8 6.5V20h-5.5v-5.5h-5V20H4z',
  search: 'M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13M15.5 15.5L20 20',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  plus: 'M12 5v14M5 12h14',
  filter: 'M4 7h16M7 12h10M10 17h4',
  back: 'M19 12H5M11 6l-6 6l6 6',
};

// One per category; names match the --pastel-cat-* tokens
const CATEGORY_ICONS = {
  grill: 'M4 10h16a8 6 0 0 1-16 0zM8 16l-2 5M16 16l2 5M9 6c0-1 1-1.5 1-3M14 6c0-1 1-1.5 1-3',
  main: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8',
  side: 'M4 11h16a8 8 0 0 1-16 0zM9 7c0-1.5 1-2 1-3M14 7c0-1.5 1-2 1-3',
  salad: 'M5 19C5 10 11 5 19 5c0 8-5 14-14 14zM5 19L13 11',
  soup: 'M3 11h18a9 7 0 0 1-18 0zM8 7c0-1.5 1-2 1-3M12 7c0-1.5 1-2 1-3M16 7c0-1.5 1-2 1-3',
  dessert: 'M7 11a5 5 0 0 1 10 0zM7 11l5 10l5-10',
  baking: 'M5 14a7 5 0 0 1 14 0v5H5zM9 14v5M12 14v5M15 14v5',
  basics: 'M12 3v10M8 13c0 4 1.8 8 4 8s4-4 4-8zM8 13h8',
};

const PATHS = { ...ICONS, ...CATEGORY_ICONS };

export type IconName = keyof typeof PATHS;

type Props = {
  name: IconName;
  /** Width and height in px at default text size (design values: 18–36) */
  size?: number;
  /** Line width on the 24×24 grid (design values: 1.8 for categories, 2.2 for tabs) */
  strokeWidth?: number;
  /** Filled shape, e.g. the heart of an active favorite */
  filled?: boolean;
};

export default function Icon({ name, size = 24, strokeWidth = 2, filled = false }: Props) {
  const sizeRem = `${size / 16}rem`;

  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: sizeRem, height: sizeRem }}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
