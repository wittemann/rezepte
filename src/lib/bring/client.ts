// Thin fetch client for Bring's unofficial API (docs/decisions/0014-bring-shopping-list.md).
// Only the two calls the app needs: log in, add an item to a list. Knows nothing about recipes.
// Credentials are passed in (no astro:env import), so it also works in tests and scripts.

import { reportError } from '../monitoring.ts';

const API_URL = 'https://api.getbring.com/rest/v2';

// Public headers of Bring's web app, as sent by the community client bring-shopping 2.0.1.
// Without the API key Bring rejects the calls.
const BRING_HEADERS = {
  'X-BRING-API-KEY': 'cof4Nc6D8saplXjE3h3HXqHH8m7VU2i1Gs0g85Sp',
  'X-BRING-CLIENT': 'webApp',
  'X-BRING-CLIENT-SOURCE': 'webApp',
  'X-BRING-COUNTRY': 'DE',
};

/** Bring answered with an error status, e.g. 401 for a wrong password. */
export class BringError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'BringError';
    this.status = status;
  }
}

/** Which account and list to use. Every call takes one of these. */
export type BringConnection = {
  email: string;
  password: string;
  listUuid: string;
  /** Replaced in tests. */
  fetch?: typeof fetch;
};

/** What a login returns and the other calls need. */
export type BringSession = {
  userUuid: string;
  accessToken: string;
};

/** One entry on the shopping list: `name` is what to buy, `specification` the amount. */
export type BringItem = {
  name: string;
  specification?: string;
};

type Operation = 'login' | 'addItem';

/** A BringError that says which call failed and why, reported to Sentry. */
async function failed(response: Response, operation: Operation) {
  const reason = (await response.text()).slice(0, 200); // Bring answers with JSON or plain text
  const error = new BringError(
    response.status,
    `Bring ${operation} failed with ${response.status}${reason ? ` (${reason})` : ''}`,
  );
  // Astro actions turn thrown errors into a 500 answer, so they wouldn't show up in Sentry otherwise
  reportError(error, { 'bring.operation': operation, 'bring.status': response.status });
  return error;
}

/** Logs in with the connection's account. Throws a BringError if Bring says no. */
export async function login(connection: BringConnection) {
  const { fetch = globalThis.fetch } = connection;
  const response = await fetch(`${API_URL}/bringauth`, {
    method: 'POST',
    headers: BRING_HEADERS,
    body: new URLSearchParams({ email: connection.email, password: connection.password }),
  });
  if (!response.ok) throw await failed(response, 'login');

  const { uuid, access_token } = (await response.json()) as {
    uuid?: unknown;
    access_token?: unknown;
  };
  if (typeof uuid !== 'string' || typeof access_token !== 'string') {
    throw new BringError(response.status, 'Bring login answered without uuid or access_token');
  }
  return { userUuid: uuid, accessToken: access_token };
}

/** Puts one item on the connection's list. */
export async function addItem(connection: BringConnection, session: BringSession, item: BringItem) {
  const { fetch = globalThis.fetch } = connection;
  const response = await fetch(`${API_URL}/bringlists/${connection.listUuid}`, {
    method: 'PUT',
    headers: {
      ...BRING_HEADERS,
      'X-BRING-USER-UUID': session.userUuid,
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: new URLSearchParams({ purchase: item.name, specification: item.specification ?? '' }),
  });
  if (!response.ok) throw await failed(response, 'addItem');
}

/** Logs in once and adds the items one after the other. Stops at the first error. */
export async function addItems(connection: BringConnection, items: BringItem[]) {
  const session = await login(connection);
  for (const item of items) await addItem(connection, session, item);
}
