// Credentials of the e2e dev server only. Not secrets: the config starts the server with the
// hash of this password, so the tests never need the real one.
export const TEST_PASSWORD = 'e2e-test-passphrase-not-a-secret';
export const TEST_SESSION_SECRET = 'e2e-test-session-secret-0123456789';
