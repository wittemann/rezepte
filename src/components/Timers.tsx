// The running timers as pills at the top of every page, and the alarm when one runs out
// (design/README.md, "Timer"). Sits in the page layout, so a timer started in cooking mode stays
// visible on the recipe page, the list and everywhere else. State: timer-store.ts.
import { useEffect, useRef, useState } from 'preact/hooks';
import { formatRemaining, isExpired, remainingSeconds, type Timer } from '../lib/timers/timers.ts';
import Maulti from './Maulti.tsx';
import { removeTimer, useTimers } from './timer-store.ts';
import { playBeeps, unlockSound } from './timer-sound.ts';
import styles from './Timers.module.css';
import { TEXT } from './Timers.texts.ts';

const TICK_MILLISECONDS = 500;
const ALARM_REPEAT_MILLISECONDS = 2500;
const VIBRATION_PATTERN = [300, 150, 300];

export default function Timers() {
  const timers = useTimers();
  const [now, setNow] = useState(Date.now());
  const hasTimers = timers.length > 0;

  useEffect(() => {
    if (!hasTimers) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), TICK_MILLISECONDS);
    // After a reload the sound is locked again until the next tap
    document.addEventListener('pointerdown', unlockSound, { once: true });
    return () => {
      clearInterval(id);
      document.removeEventListener('pointerdown', unlockSound);
    };
  }, [hasTimers]);

  const running = timers.filter((timer) => !isExpired(timer, now));
  const ringing = timers.find((timer) => isExpired(timer, now));

  return (
    <>
      {running.length > 0 && (
        <ul class={styles.pills}>
          {running.map((timer) => (
            <li key={timer.id} class={styles.pill}>
              <span class={styles.remaining}>{formatRemaining(remainingSeconds(timer, now))}</span>
              <span class={styles.description}>
                <span class={styles.title}>{timer.recipeTitle}</span>
                <span class={styles.step}>{TEXT.pillStep(timer.stepNumber)}</span>
              </span>
              <button
                type="button"
                class={styles.cancel}
                aria-label={TEXT.cancel}
                onClick={() => removeTimer(timer.id)}
              >
                <span aria-hidden="true">{TEXT.cancelSymbol}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {ringing && <Alarm key={ringing.id} timer={ringing} />}
    </>
  );
}

/** Overlay with sound and vibration until "Alles klar"; the next ringing timer follows. */
function Alarm({ timer }: { timer: Timer }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    function ring() {
      playBeeps();
      navigator.vibrate?.(VIBRATION_PATTERN);
    }
    ring();
    const id = setInterval(ring, ALARM_REPEAT_MILLISECONDS);
    return () => {
      clearInterval(id);
      navigator.vibrate?.(0);
    };
  }, []);

  const acknowledge = () => removeTimer(timer.id);

  return (
    // Escape closes the dialog by itself, which counts as "Alles klar" too
    <dialog ref={dialogRef} class={styles.alarm} onClose={acknowledge}>
      <Maulti pose="alarm" size={130} />
      <h2 class={styles.alarmTitle}>{TEXT.alarmTitle}</h2>
      <p class={styles.alarmMessage}>
        {TEXT.alarmMessage(timer.recipeTitle, timer.stepNumber, timer.label)}
      </p>
      <button type="button" class={styles.acknowledge} onClick={acknowledge}>
        {TEXT.acknowledge}
      </button>
    </dialog>
  );
}
