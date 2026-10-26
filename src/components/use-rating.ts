// The shared rating of one recipe, as the stars show it: picking a star changes it at once and
// saves it through the setRating action. Tapping the selected star again removes the rating.
// If saving fails, the stars go back to the last saved value and `failed` is set, for a toast.
import { actions } from 'astro:actions';
import { useRef, useState } from 'preact/hooks';
import type { Rating } from '../lib/recipes/fields.ts';

export function useRating(recipeId: string, initialRating: Rating | undefined) {
  const [rating, setRating] = useState(initialRating);
  const [failed, setFailed] = useState(false);
  const savedRating = useRef(initialRating);
  // Only the answer to the latest pick may roll back; an older one would undo a newer tap
  const latestPick = useRef(0);

  async function pick(value: Rating) {
    const wanted = value === rating ? undefined : value;
    setRating(wanted);
    const pickNumber = ++latestPick.current;
    const { data, error } = await actions.setRating({ id: recipeId, rating: wanted ?? null });
    if (!error) {
      savedRating.current = data.rating ?? undefined;
    } else if (pickNumber === latestPick.current) {
      setRating(savedRating.current);
      setFailed(true);
    }
  }

  return { rating, pick, failed, clearFailed: () => setFailed(false) };
}
