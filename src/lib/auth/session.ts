// Session cookie (docs/specs/04-auth.md). Uses node:crypto only.
// Value: <issuedAt>.<signature>, issuedAt in Unix seconds, signature = HMAC-SHA256(issuedAt, secret) as base64url.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

function sign(issuedAt: string, secret: string) {
  return createHmac('sha256', secret).update(issuedAt).digest('base64url');
}

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

export function createSessionToken(secret: string, issuedAt = nowInSeconds()) {
  const issuedAtText = String(issuedAt);
  return `${issuedAtText}.${sign(issuedAtText, secret)}`;
}

/**
 * True if `token` was signed with `secret` and is not older than the cookie's max age.
 * The age check means a copied cookie stops working even if a browser ignores Max-Age.
 */
export function verifySessionToken(
  token: string | undefined,
  secret: string,
  now = nowInSeconds(),
) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [issuedAtText, signature] = parts;
  if (!/^\d+$/.test(issuedAtText)) return false;
  if (now - Number(issuedAtText) > SESSION_MAX_AGE_SECONDS) return false;

  const expected = Buffer.from(sign(issuedAtText, secret));
  const actual = Buffer.from(signature);
  // timingSafeEqual throws on different lengths; the length itself is not secret.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
