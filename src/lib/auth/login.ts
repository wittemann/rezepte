// Login check and session cookie settings (docs/specs/04-auth.md).
import type { AstroCookieSetOptions } from 'astro';
import { verifyPassword } from './password.ts';
import { SESSION_MAX_AGE_SECONDS } from './session.ts';

/** Slows down guessing a little; the real protection is a long passphrase. */
export const FAILED_LOGIN_DELAY_MS = 500;

export const SESSION_COOKIE_OPTIONS: AstroCookieSetOptions = {
  httpOnly: true,
  // Only over HTTPS in production. In dev, Safari (e.g. an iPhone on the local network)
  // would drop a Secure cookie sent over plain http.
  secure: import.meta.env.PROD,
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * True if `password` (the form field) matches the stored hash.
 * A wrong or missing password only returns after the delay.
 */
export async function checkPassword(
  password: FormDataEntryValue | null,
  storedHash: string,
  delay: (ms: number) => Promise<void> = wait,
): Promise<boolean> {
  const correct =
    typeof password === 'string' && password !== '' && (await verifyPassword(password, storedHash));
  if (!correct) await delay(FAILED_LOGIN_DELAY_MS);
  return correct;
}
