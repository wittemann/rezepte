// Bottom sheet for the filter sheet and the ingredients in cooking mode
// (design/README.md, "Filter-Sheet" and "Kochmodus"). Used inside other islands,
// which own the open state. Keep it mounted and toggle `open` (no
// `{open && <BottomSheet />}`), otherwise closing and focus restore can't run.
//
// Built on the native <dialog> with showModal(): the browser keeps focus inside,
// makes the page behind inert, closes on Escape and draws the backdrop. Supported
// since iOS Safari 15.4, and less code to get wrong than a hand-made focus trap.
import type { ComponentChildren } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';
import styles from './BottomSheet.module.css';
import { TEXT } from './BottomSheet.texts.ts';

interface Props {
  open: boolean;
  /** Called when the user closes the sheet (Escape, backdrop, close button) */
  onClose: () => void;
  /** Heading of the sheet, also its accessible name */
  title: string;
  /** Shown at the top right instead of the close button (e.g. "Zurücksetzen") */
  headerAction?: ComponentChildren;
  children: ComponentChildren;
}

export default function BottomSheet({ open, onClose, title, headerAction, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const pressedOnBackdropRef = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      openerRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Every way of closing ends here, including Escape, which the browser handles itself
  function handleClose() {
    // The `close` event is queued: if the sheet was reopened in between, it's stale
    if (dialogRef.current?.open) return;
    // Safety net: browsers should restore focus on close themselves, but Safari's
    // focus handling is unreliable (it often doesn't even focus a button on click)
    openerRef.current?.focus();
    openerRef.current = null;
    // `open` is already false when the parent closed the sheet
    if (open) onClose();
  }

  // Clicks on the backdrop land on the <dialog> itself, clicks on the content don't
  // (a click on the dialog's border counts as backdrop too, which is fine).
  // Also checking where the press started keeps a drag out of the content from closing it.
  function handlePointerDown(event: PointerEvent) {
    pressedOnBackdropRef.current = event.target === dialogRef.current;
  }

  function handleClick(event: MouseEvent) {
    if (pressedOnBackdropRef.current && event.target === dialogRef.current) {
      dialogRef.current?.close();
    }
    pressedOnBackdropRef.current = false;
  }

  return (
    <dialog
      ref={dialogRef}
      class={styles.sheet}
      aria-modal="true"
      aria-labelledby={titleId}
      onClose={handleClose}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <div class={styles.header}>
        <h2 id={titleId} class={styles.title}>
          {title}
        </h2>
        {headerAction ?? (
          <button
            type="button"
            class={styles.close}
            aria-label={TEXT.close}
            onClick={() => dialogRef.current?.close()}
          >
            <span aria-hidden="true">{TEXT.closeSymbol}</span>
          </button>
        )}
      </div>
      <div class={styles.body}>{children}</div>
    </dialog>
  );
}
