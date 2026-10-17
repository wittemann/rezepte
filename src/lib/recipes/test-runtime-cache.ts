// Stand-in for @vercel/functions in tests: `vi.mock('@vercel/functions', () => import(...))`.
// The Runtime Cache is a Map that tests can look into and change; waitUntil collects the
// background work, so tests can wait for it.

export const runtimeCache = new Map<string, unknown>();
export const backgroundWork: Promise<unknown>[] = [];

// When true, every call fails, like a Runtime Cache that can't be reached
let unavailable = false;

export function makeRuntimeCacheUnavailable() {
  unavailable = true;
}

function checkAvailable() {
  if (unavailable) throw new Error('Runtime Cache unavailable');
}

export function getCache() {
  return {
    get: async (key: string) => {
      checkAvailable();
      return runtimeCache.get(key) ?? null;
    },
    // A copy, like the real cache, which stores the value as JSON
    set: async (key: string, value: unknown) => {
      checkAvailable();
      runtimeCache.set(key, structuredClone(value));
    },
    delete: async (key: string) => {
      checkAvailable();
      runtimeCache.delete(key);
    },
    expireTag: async () => {},
  };
}

export function waitUntil(promise: Promise<unknown>) {
  backgroundWork.push(promise);
}

/** Waits for all background work started so far. */
export async function backgroundWorkDone() {
  await Promise.all(backgroundWork.splice(0));
}

export function resetRuntimeCache() {
  runtimeCache.clear();
  backgroundWork.length = 0;
  unavailable = false;
}
