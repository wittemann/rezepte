// The heart on the recipe detail page: marks the recipe as favorite for everyone (it is saved in
// Airtable through the setFavorite action). The heart changes at once; if saving fails, it goes
// back and a toast says so.
import { actions } from 'astro:actions';
import { useState } from 'preact/hooks';
import Icon from './Icon.tsx';
import Toast from './Toast.tsx';
import styles from './FavoriteButton.module.css';
import { TEXT } from './FavoriteButton.texts.ts';

type Props = {
  recipeId: string;
  /** State when the page was rendered */
  favorite: boolean;
};

export default function FavoriteButton({ recipeId, favorite: initialFavorite }: Props) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [message, setMessage] = useState<string | null>(null);

  async function toggle() {
    const wanted = !favorite;
    setFavorite(wanted);
    const { error } = await actions.setFavorite({ id: recipeId, favorite: wanted });
    if (error) {
      setFavorite(!wanted);
      setMessage(TEXT.error);
    }
  }

  return (
    <>
      <button
        type="button"
        class={favorite ? `${styles.button} ${styles.favorite}` : styles.button}
        aria-label={favorite ? TEXT.remove : TEXT.add}
        aria-pressed={favorite}
        onClick={toggle}
      >
        <Icon name="heart" size={22} strokeWidth={2.2} filled={favorite} />
      </button>
      <Toast message={message} onDone={() => setMessage(null)} />
    </>
  );
}
