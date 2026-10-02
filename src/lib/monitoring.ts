// What the app reports to Sentry itself (docs/decisions/0009-error-monitoring.md). In one place,
// so lib/ code doesn't depend on the SDK and tests can replace it. Without SENTRY_DSN the SDK is
// never initialized and these calls do nothing.

import * as Sentry from '@sentry/astro';

/** Searchable in Sentry, e.g. `airtable.status:429`. Never recipe names or texts. */
export type ReportTags = Record<string, string | number>;

/** An error worth an issue in Sentry, e.g. one the app rethrows. Reported once per error object. */
export function reportError(error: unknown, tags: ReportTags) {
  Sentry.captureException(error, { tags });
}

/** Something that didn't fail but needs a look, e.g. an Airtable rate limit. */
export function reportWarning(message: string, tags: ReportTags) {
  Sentry.captureMessage(message, { level: 'warning', tags });
}

/** A line in Sentry Logs, e.g. that a recipe was saved. Record IDs only, never recipe names or texts. */
export function logInfo(message: string, attributes: ReportTags = {}) {
  Sentry.logger.info(message, attributes);
}

/** A Sentry Logs line for something that went wrong but needs no issue, e.g. a wrong password. */
export function logWarning(message: string, attributes: ReportTags = {}) {
  Sentry.logger.warn(message, attributes);
}
