# 04 – Auth

Decision: [ADR 0004](../decisions/0004-shared-password-auth.md). The password is **never** in the repo.

## Flow

1. Any request without a valid session cookie → redirect to `/login?next=<path>`
2. `/login` shows a single password field with a show/hide toggle, as designed (`design/README.md`, „0. Login“). A plain `<form>`, so it works without JS and the iOS password manager recognizes it; JS only adds the toggle and resets the error state while typing
3. On POST, the server hashes the input with scrypt and compares it in constant time (`timingSafeEqual`) to `APP_PASSWORD_HASH`
4. Success → set cookie `session` = `<issuedAt>.<HMAC-SHA256(issuedAt, SESSION_SECRET)>`, then redirect to `next` (local paths only) or the start page. Failure → error text, Maulti `think`, accent border, after the ~500 ms delay
   - `HttpOnly`, `Secure` (production only: the dev server runs on plain http, and Safari on an iPhone in the local network would drop the cookie), `SameSite=Lax`, `Path=/`, `Max-Age` ≈ 1 year
5. Middleware verifies the signature on every request except `/login` and static assets
   - `/login` itself sends someone who already has a valid session straight on to `next` (never back to `/login`). A home screen app added on the login page always starts there
6. Logout: **not in v1**. Later, `/logout` (POST) deletes the cookie, once the design has a place for it. Until then, rotating `SESSION_SECRET` logs everyone out

## Password lifecycle

- **Set / change:** run `npm run hash-password`, type the password, and paste the printed value into Vercel as `APP_PASSWORD_HASH`, then redeploy. Old sessions stay valid.
- **Log everyone out:** set a new `SESSION_SECRET` and redeploy.
- **Hash format:** `scrypt:<salt-base64>:<hash-base64>` using `node:crypto` only, no dependency (`src/lib/auth/password.ts`). Parameters: N=2^15, r=8, p=1, 16-byte salt, 64-byte key. The password is Unicode-normalized (NFC) first, so umlauts typed on different devices match.
  - The separator is `:`, not `$`: Vite expands `$…` as variables when it loads `.env`, even inside quotes, which would silently corrupt the hash.
- **Minimum length:** the script refuses passwords shorter than 16 characters (see "Protection against guessing").

## Protection against guessing

Minimal: a delay of about 500 ms on a failed attempt. Good enough for a small, trusted group; revisit if logs show abuse.

The delay is a speed bump, not a lock: serverless functions run in parallel, so an attacker can still send many guesses at once. What actually protects the app is the password itself. **Use a long passphrase** (for example four or more random words), not a short password.

## Out of scope

Individual accounts, password reset, 2FA.
