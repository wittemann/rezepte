// Short message in a pill above the tab bar, e.g. "Gespeichert" after saving on the
// "Bearbeiten"/"Neu" screen. The caller passes the text (from its own texts file) and
// clears it in `onDone`, which is called after `duration`.
// The status wrapper is always mounted because the live region must exist before its text
// appears: screen readers only announce text inserted into an existing `role="status"` element.
import { useEffect, useRef } from 'preact/hooks';
import styles from './Toast.module.css';

type Props = {
  /** Text to show; `null` shows nothing */
  message: string | null;
  /** Called once after `duration`; the parent is expected to set `message` back to `null` */
  onDone: () => void;
  /** Milliseconds before `onDone`. Prototype: 1600; longer here so screen reader users can follow. */
  duration?: number;
};

export default function Toast({ message, onDone, duration = 2500 }: Props) {
  // In a ref so a new callback identity from the parent doesn't restart the timer
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (message === null) return;
    const id = setTimeout(() => onDoneRef.current(), duration);
    return () => clearTimeout(id);
  }, [message, duration]);

  return <div role="status">{message !== null && <div class={styles.toast}>{message}</div>}</div>;
}
