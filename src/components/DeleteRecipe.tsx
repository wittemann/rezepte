// „Rezept löschen“ at the end of the edit page: asks in a sheet first, then deletes the recipe for
// everyone through the deleteRecipe action and goes to the recipe list. A recipe that is gone
// already counts as deleted. If deleting fails, the sheet stays open and a toast says so.
// No design for it: built from the bottom sheet and the button styles (05-design-integration).
import { actions } from 'astro:actions';
import { useState } from 'preact/hooks';
import BottomSheet from './BottomSheet.tsx';
import Toast from './Toast.tsx';
import styles from './DeleteRecipe.module.css';
import { TEXT } from './DeleteRecipe.texts.ts';

type Props = {
  recipeId: string;
  /** Named in the question, so nobody deletes the wrong recipe */
  title: string;
};

export default function DeleteRecipe({ recipeId, title }: Props) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function deleteRecipe() {
    setDeleting(true);
    const { error } = await actions.deleteRecipe({ id: recipeId });
    if (!error || error.code === 'NOT_FOUND') {
      // replace: back from the list doesn't lead to the edit page of a recipe that is gone
      window.location.replace('/recipes');
      return;
    }
    setDeleting(false);
    setMessage(TEXT.error);
  }

  return (
    <div class={styles.wrapper}>
      <button type="button" class={styles.open} onClick={() => setOpen(true)}>
        {TEXT.open}
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={TEXT.title}>
        <p class={styles.question}>{TEXT.question(title)}</p>
        <div class={styles.actions}>
          <button type="button" class={styles.confirm} disabled={deleting} onClick={deleteRecipe}>
            {deleting ? TEXT.deleting : TEXT.confirm}
          </button>
          <button
            type="button"
            class={styles.cancel}
            disabled={deleting}
            onClick={() => setOpen(false)}
          >
            {TEXT.cancel}
          </button>
        </div>
      </BottomSheet>
      <Toast message={message} onDone={() => setMessage(null)} />
    </div>
  );
}
