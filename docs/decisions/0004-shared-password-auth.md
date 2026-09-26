# 0004 – Shared password, hash in env, signed cookie

**Status:** Accepted (2026-09-26)

## Context

Two users, one shared password is enough. The code goes to GitHub, so the password must not be in the repo. Vercel's built-in password protection is a paid feature.

## Decision

- The password exists **only as a scrypt hash** in the env var `APP_PASSWORD_HASH` (produced by `npm run hash-password`, `node:crypto` only)
- Login sets an HMAC-signed, `HttpOnly`/`Secure`/`SameSite=Lax` cookie valid for about a year. The signing key is in the env var `SESSION_SECRET`
- Astro middleware protects every route except `/login` and static assets
- Details: [04-auth](../specs/04-auth.md); env handling: [06-deployment](../specs/06-deployment.md)

## Consequences

- Nothing sensitive in git. Changing the password is just an env var update plus a redeploy
- One password for both people, so there's no per-user attribution of edits
- Logging everyone out means rotating `SESSION_SECRET`
- The failed-login delay only slows guessing down; it doesn't stop parallel requests. The real protection is a long passphrase ([04-auth](../specs/04-auth.md))
