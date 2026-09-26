import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.ts';

describe('hashPassword', () => {
  it('produces the scrypt:<salt>:<hash> format', async () => {
    expect(await hashPassword('Kartoffelsalat mit Gurke')).toMatch(
      /^scrypt:[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*$/,
    );
  });

  it('uses a fresh salt each time', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });
});

describe('verifyPassword', () => {
  it('accepts the right password', async () => {
    const hash = await hashPassword('Kartoffelsalat mit Gurke');
    expect(await verifyPassword('Kartoffelsalat mit Gurke', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('Kartoffelsalat mit Gurke');
    expect(await verifyPassword('Kartoffelsalat mit Gurken', hash)).toBe(false);
  });

  it('treats composed and decomposed umlauts as the same password', async () => {
    const hash = await hashPassword('Kn\u00f6del');
    expect(await verifyPassword('Kno\u0308del', hash)).toBe(true);
  });

  it.each(['', 'plaintext', 'bcrypt:abc:def', 'scrypt:abc', 'scrypt:c2FsdA==:aGFzaA=='])(
    'rejects a malformed stored hash: %j',
    async (stored) => {
      expect(await verifyPassword('anything', stored)).toBe(false);
    },
  );
});
