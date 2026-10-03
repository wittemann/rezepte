import { ActionError } from 'astro:actions';
import { reportError } from '../lib/monitoring.ts';

/**
 * Wraps an action handler so that unexpected errors reach the browser only as a generic message.
 * Astro would send the original message, which for Airtable errors holds the base and table IDs
 * and Airtable's own text. The full error goes to Sentry (an error already reported isn't sent
 * twice). ActionErrors like NOT_FOUND are meant for the browser and pass unchanged.
 */
export function withGenericErrors<Input, Output>(
  action: string,
  handler: (input: Input) => Promise<Output>,
) {
  return async (input: Input) => {
    try {
      return await handler(input);
    } catch (error) {
      if (error instanceof ActionError) throw error;
      reportError(error, { action });
      throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'The action failed' });
    }
  };
}
