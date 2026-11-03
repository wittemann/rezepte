// „Rezept teilen“ on the recipe page (design/README.md, "10. Teilen";
// docs/decisions/0015-share-recipe-as-text.md): opens the share sheet with the recipe as plain
// text. Without a share sheet (some desktop browsers) the text goes to the clipboard and a toast
// says so. Cancelling the share sheet does nothing.
import { useRef, useState } from 'preact/hooks';
import Toast from './Toast.tsx';
import styles from './ShareButton.module.css';
import { TEXT } from './ShareButton.texts.ts';

type Props = {
  title: string;
  /** The whole recipe as plain text (lib/recipes/share-text.ts) */
  text: string;
  /** Alone on the page (recipe without ingredients): full width, with the label */
  wide?: boolean;
};

async function shareOrCopy(title: string, text: string) {
  if ('share' in navigator) {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Any other refusal (e.g. NotAllowedError): try the clipboard instead
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    // No clipboard either (insecure context) or the browser refused
    return 'failed';
  }
}

export default function ShareButton({ title, text, wide = false }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  // While the share sheet is open, a second share() call would fail and end up in the fallback
  const busy = useRef(false);

  async function share() {
    if (busy.current) return;
    busy.current = true;
    const outcome = await shareOrCopy(title, text);
    busy.current = false;
    if (outcome === 'copied') setMessage(TEXT.copied);
    if (outcome === 'failed') setMessage(TEXT.copyFailed);
  }

  return (
    <>
      <button
        type="button"
        class={wide ? styles.wide : styles.round}
        aria-label={wide ? undefined : TEXT.label}
        onClick={share}
      >
        <svg class={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 14.5V3.5M8 7.5l4-4 4 4M8.5 10.5H7a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1.5" />
        </svg>
        {wide && TEXT.label}
      </button>
      <Toast message={message} onDone={() => setMessage(null)} />
    </>
  );
}
