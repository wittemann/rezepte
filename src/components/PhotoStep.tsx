// Card content of the photo step: the recipe has no photo yet, so cooking mode ends by asking for
// one. The upload itself is in use-photo-upload.ts; this only shows its state.
import styles from './PhotoStep.module.css';
import { TEXT } from './PhotoStep.texts.ts';
import type { PhotoStatus } from './use-photo-upload.ts';

type Props = {
  status: PhotoStatus;
  previewUrl?: string;
  onPick: (file: File) => void;
};

export default function PhotoStep({ status, previewUrl, onPick }: Props) {
  function handleChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    // Cleared so picking the same photo again after an error still counts as a change
    input.value = '';
    if (file) onPick(file);
  }

  return (
    <>
      <p class={styles.title}>{TEXT.title}</p>
      {status !== 'saved' && <p class={styles.explanation}>{TEXT.explanation}</p>}
      {previewUrl && <img class={styles.preview} src={previewUrl} alt={TEXT.previewAlt} />}
      <div role="status" class={styles.status}>
        {status === 'uploading' && TEXT.uploading}
        {status === 'saved' && TEXT.saved}
        {status === 'failed' && <span class={styles.failed}>{TEXT.failed}</span>}
      </div>
      {(status === 'none' || status === 'failed') && (
        <label class={styles.pick}>
          {status === 'failed' ? TEXT.retry : TEXT.take}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            class={styles.input}
            onChange={handleChange}
          />
        </label>
      )}
    </>
  );
}
