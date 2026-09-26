// Shared-password hashing (docs/specs/04-auth.md). Uses node:crypto only.
// Format: scrypt:<salt-base64>:<hash-base64>
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

// N=2^15, r=8 needs 32 MiB; maxmem leaves headroom above Node's 32 MiB default.
const SCRYPT_OPTIONS: ScryptOptions = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const PREFIX = 'scrypt';

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFC'), salt, KEY_LENGTH, SCRYPT_OPTIONS, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt);
  return [PREFIX, salt.toString('base64'), key.toString('base64')].join(':');
}

/** Constant-time check of `password` against a stored hash. A malformed hash never matches. */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== PREFIX) return false;
  const salt = Buffer.from(parts[1], 'base64');
  const expected = Buffer.from(parts[2], 'base64');
  if (salt.length !== SALT_LENGTH || expected.length !== KEY_LENGTH) return false;
  const actual = await deriveKey(password, salt);
  return timingSafeEqual(actual, expected);
}
