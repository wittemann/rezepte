// Keeps the screen on while the component is mounted (Screen Wake Lock API). The browser drops
// the lock whenever the page is hidden, so it is requested again when the page comes back.
// Safari only grants the lock right after a tap (user activation), so a refused request is tried
// again on the next tap. Browsers without the API, or a refused request (e.g. low battery), just
// don't keep the screen on.
import { useEffect } from 'preact/hooks';

// Events that count as a tap or key press for user activation
const USER_GESTURES = ['click', 'touchend', 'keydown'] as const;

export function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;

    let lock: WakeLockSentinel | undefined;
    let requesting = false;
    let unmounted = false;

    async function acquire() {
      if (lock || requesting) return;
      requesting = true;
      try {
        const requested = await navigator.wakeLock.request('screen');
        // Unmounted while the request was pending
        if (unmounted) {
          await requested.release();
          return;
        }
        lock = requested;
        // Released by the browser (page hidden): forget it, so it can be requested again
        requested.addEventListener('release', () => {
          if (lock === requested) lock = undefined;
        });
      } catch {
        // Refused, e.g. by Safari before the first tap: the next tap tries again
      } finally {
        requesting = false;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') void acquire();
    }

    function handleUserGesture() {
      void acquire(); // does nothing while the lock is held
    }

    void acquire();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Capture, so a component that stops the event can't keep the lock from being requested
    for (const type of USER_GESTURES) {
      document.addEventListener(type, handleUserGesture, { capture: true });
    }
    return () => {
      unmounted = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      for (const type of USER_GESTURES) {
        document.removeEventListener(type, handleUserGesture, { capture: true });
      }
      void lock?.release();
    };
  }, []);
}
