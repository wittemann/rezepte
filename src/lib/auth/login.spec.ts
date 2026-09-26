import { beforeAll, describe, expect, it, vi } from 'vitest';
import { checkPassword, FAILED_LOGIN_DELAY_MS, SESSION_COOKIE_OPTIONS } from './login.ts';
import { hashPassword } from './password.ts';
import { SESSION_MAX_AGE_SECONDS } from './session.ts';

const PASSWORD = 'Kartoffelsalat mit Gurke';
let storedHash: string;

beforeAll(async () => {
  storedHash = await hashPassword(PASSWORD);
});

describe('checkPassword', () => {
  it('accepts the right password right away', async () => {
    const delay = vi.fn(async () => {});
    expect(await checkPassword(PASSWORD, storedHash, delay)).toBe(true);
    expect(delay).not.toHaveBeenCalled();
  });

  it('rejects a wrong password after the delay', async () => {
    const delay = vi.fn(async () => {});
    expect(await checkPassword('Kartoffelsalat', storedHash, delay)).toBe(false);
    expect(delay).toHaveBeenCalledWith(FAILED_LOGIN_DELAY_MS);
  });

  it.each([null, '', new File(['x'], 'x.txt')])(
    'rejects a missing or odd form value: %s',
    async (value) => {
      const delay = vi.fn(async () => {});
      expect(await checkPassword(value, storedHash, delay)).toBe(false);
      expect(delay).toHaveBeenCalledOnce();
    },
  );
});

describe('SESSION_COOKIE_OPTIONS', () => {
  it('keeps the cookie away from scripts and other sites, for about a year', () => {
    expect(SESSION_COOKIE_OPTIONS).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  });
});
