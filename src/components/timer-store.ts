// The running timers, kept in localStorage so they survive page changes and reloads, and shared
// between every island on the page (and other tabs) through events. If storage is blocked
// (private window), timers still work for as long as the page stays open.
import { useEffect, useState } from 'preact/hooks';
import { parseTimers, type Timer } from '../lib/timers/timers.ts';

const STORAGE_KEY = 'timers';
const CHANGED_EVENT = 'timers-changed';

let fallback: Timer[] = [];

function readTimers() {
  try {
    return parseTimers(localStorage.getItem(STORAGE_KEY));
  } catch {
    return fallback;
  }
}

function writeTimers(timers: Timer[]) {
  fallback = timers;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  } catch {
    // Kept in `fallback` only
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function addTimer(timer: Timer) {
  writeTimers([...readTimers(), timer]);
}

export function removeTimer(id: string) {
  writeTimers(readTimers().filter((timer) => timer.id !== id));
}

/** The current timers. Empty on the server and during hydration, filled right after. */
export function useTimers() {
  const [timers, setTimers] = useState<Timer[]>([]);

  useEffect(() => {
    const update = () => setTimers(readTimers());
    update();
    // Same page (CHANGED_EVENT) and other tabs (`storage`)
    window.addEventListener(CHANGED_EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(CHANGED_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return timers;
}
