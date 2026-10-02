// Kitchen timers (design/README.md, "Timer"; docs/decisions/0012-pwa-and-timers.md). Pure logic:
// a timer is a point in time, so it keeps running while the page is closed or in the background.
// Storing and ringing are in components/timer-store.ts and components/Timers.tsx.

export type Timer = {
  id: string;
  recipeTitle: string;
  stepNumber: number;
  /** What the alarm says was set: "25 Minuten" */
  label: string;
  /** Epoch milliseconds */
  endsAt: number;
};

export type NewTimer = Pick<Timer, 'recipeTitle' | 'stepNumber' | 'label'> & { minutes: number };

export function createTimer({ minutes, ...details }: NewTimer, now: number) {
  return { id: crypto.randomUUID(), ...details, endsAt: now + minutes * 60_000 };
}

/** Whole seconds left, rounded up so the display shows 0:01 until the very end. */
export function remainingSeconds(timer: Timer, now: number) {
  return Math.max(0, Math.ceil((timer.endsAt - now) / 1000));
}

export function isExpired(timer: Timer, now: number) {
  return timer.endsAt <= now;
}

/** 90 → "1:30", 3725 → "1:02:05" */
export function formatRemaining(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  if (hours === 0) return `${minutes}:${rest}`;
  return `${hours}:${String(minutes).padStart(2, '0')}:${rest}`;
}

/** Timers from storage. Anything that isn't a well-formed timer is dropped, never thrown on. */
export function parseTimers(json: string | null) {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter(isTimer) : [];
  } catch {
    return [];
  }
}

function isTimer(value: unknown): value is Timer {
  if (typeof value !== 'object' || value === null) return false;
  const timer = value as Record<string, unknown>;
  return (
    typeof timer.id === 'string' &&
    typeof timer.recipeTitle === 'string' &&
    typeof timer.stepNumber === 'number' &&
    typeof timer.label === 'string' &&
    typeof timer.endsAt === 'number' &&
    Number.isFinite(timer.endsAt)
  );
}
