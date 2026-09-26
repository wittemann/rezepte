import { describe, expect, it } from 'vitest';
import { createSessionToken, SESSION_MAX_AGE_SECONDS, verifySessionToken } from './session.ts';

const SECRET = 'test-secret-not-used-anywhere-else';
const ISSUED_AT = 1_790_000_000;

describe('createSessionToken', () => {
  it('produces <issuedAt>.<base64url signature>', () => {
    expect(createSessionToken(SECRET, ISSUED_AT)).toMatch(/^1790000000\.[A-Za-z0-9_-]{43}$/);
  });
});

describe('verifySessionToken', () => {
  const token = createSessionToken(SECRET, ISSUED_AT);

  it('accepts a token it created', () => {
    expect(verifySessionToken(token, SECRET, ISSUED_AT)).toBe(true);
  });

  it('accepts a token right up to the max age', () => {
    expect(verifySessionToken(token, SECRET, ISSUED_AT + SESSION_MAX_AGE_SECONDS)).toBe(true);
  });

  it('rejects a token older than the max age', () => {
    expect(verifySessionToken(token, SECRET, ISSUED_AT + SESSION_MAX_AGE_SECONDS + 1)).toBe(false);
  });

  it('rejects a token signed with another secret (e.g. after rotating SESSION_SECRET)', () => {
    expect(verifySessionToken(token, 'another-secret', ISSUED_AT)).toBe(false);
  });

  it('rejects a token whose issuedAt was changed', () => {
    const signature = token.split('.')[1];
    expect(verifySessionToken(`${ISSUED_AT + 1}.${signature}`, SECRET, ISSUED_AT)).toBe(false);
  });

  it.each([undefined, '', 'abc', '1790000000', '1790000000.', '.sig', 'x.sig', '1.2.3', '-1.sig'])(
    'rejects a malformed token: %j',
    (bad) => {
      expect(verifySessionToken(bad, SECRET, ISSUED_AT)).toBe(false);
    },
  );
});
