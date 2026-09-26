# 04 – Auth

Decision: [ADR 0004](../decisions/0004-shared-password-auth.md). The password is **never** in the repo.

## Flow

1. Any request without a valid session cookie → redirect to `/login?next=<path>`
2. `/login` shows a single password field (German UI)
3. On POST, the server hashes the input with scrypt and compares it in constant time (`timingSafeEqual`) to `APP_PASSWORD_HASH`
4. Success → set cookie `session` = `<issuedAt>.<HMAC-SHA256(issuedAt, SESSION_SECRET)>`
   - `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age` ≈ 1 year
5. Middleware verifies the signature on every request except `/login` and static assets
6. `/logout` (POST) deletes the cookie

## Password lifecycle

- **Set / change:** run `npm run hash-password`, type the password, and paste the printed value into Vercel as `APP_PASSWORD_HASH`, then redeploy. Old sessions stay valid.
- **Log everyone out:** set a new `SESSION_SECRET` and redeploy.
- **Hash format:** `scrypt$<salt-base64>$<hash-base64>` using `node:crypto` only, no dependency.

## Protection against guessing

Minimal: a delay of about 500 ms on a failed attempt. Good enough for a two-person app; revisit if logs show abuse.

The delay is a speed bump, not a lock: serverless functions run in parallel, so an attacker can still send many guesses at once. What actually protects the app is the password itself. **Use a long passphrase** (for example four or more random words), not a short password.

## Out of scope

Individual accounts, password reset, 2FA.
