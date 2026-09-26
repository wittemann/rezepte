# 0004 – Shared password, hash in env, signed cookie

**Status:** Accepted (2026-09-26)

## Context

A small, trusted group (family and friends; originally two users, widened 2026-09-26) all edit the same cookbook. One shared password is enough. The code goes to GitHub, so the password must not be in the repo. Vercel's built-in password protection is a paid feature.

## Decision

- The password exists **only as a scrypt hash** in the env var `APP_PASSWORD_HASH` (produced by `npm run hash-password`, `node:crypto` only)
- Login sets an HMAC-signed, `HttpOnly`/`Secure`/`SameSite=Lax` cookie valid for about a year. The signing key is in the env var `SESSION_SECRET`
- Astro middleware protects every route except `/login` and static assets
- Details: [04-auth](../specs/04-auth.md); env handling: [06-deployment](../specs/06-deployment.md)

## Consequences

- Nothing sensitive in git. Changing the password is just an env var update plus a redeploy
- One password for everyone, so there's no per-user attribution of edits (Airtable's revision history shows only the token's owner)
- Logging everyone out means rotating `SESSION_SECRET`. To shut one person out, change the password **and** rotate `SESSION_SECRET`, then share the new password with the others
- The more people know the password, the more likely it leaks; a long passphrase matters even more
- The failed-login delay only slows guessing down; it doesn't stop parallel requests. The real protection is a long passphrase ([04-auth](../specs/04-auth.md))
