// Keeps the screen on while the component is mounted (Screen Wake Lock API). The browser drops
// the lock whenever the page is hidden, so it is requested again when the page comes back.
// Browsers without the API, or a refused request (e.g. low battery), just don't keep the screen on.
import { useEffect } from 'preact/hooks';

export function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;

    let lock: WakeLockSentinel | undefined;
    let unmounted = false;

    async function acquire() {
      try {
        const requested = await navigator.wakeLock.request('screen');
        // Unmounted while the request was pending
        if (unmounted) await requested.release();
        else lock = requested;
      } catch {
        // Nothing to do: the screen may dim, which is the same as without cooking mode
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') void acquire();
    }

    void acquire();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      unmounted = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void lock?.release();
    };
  }, []);
}
