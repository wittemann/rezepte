import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reportError } from '../monitoring.ts';
import { addItem, addItems, BringError, login } from './client.ts';

vi.mock('../monitoring.ts', () => ({ reportError: vi.fn() }));

beforeEach(() => {
  vi.mocked(reportError).mockClear();
});

const LIST_UUID = 'list-uuid-test';
const SESSION = { userUuid: 'user-uuid-test', accessToken: 'token-test' };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

const loggedIn = () => jsonResponse({ uuid: SESSION.userUuid, access_token: SESSION.accessToken });
const added = () => new Response(null, { status: 204 });

/** A connection whose fetch returns `responses` in order. */
function connectionAnswering(...responses: Response[]) {
  const fetch = vi.fn<typeof globalThis.fetch>();
  for (const response of responses) fetch.mockResolvedValueOnce(response);
  const connection = {
    email: 'test@example.com',
    password: 'not-a-real-password',
    listUuid: LIST_UUID,
    fetch,
  };
  return { connection, fetch };
}

/** The form fields of a fetch call's body. */
function formOf(init: RequestInit | undefined) {
  return Object.fromEntries(new URLSearchParams(String(init?.body)));
}

describe('login', () => {
  it('posts the credentials as a form, with the web-app API key', async () => {
    const { connection, fetch } = connectionAnswering(loggedIn());
    await login(connection);

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://api.getbring.com/rest/v2/bringauth');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toHaveProperty('X-BRING-API-KEY');
    expect(formOf(init)).toEqual({ email: 'test@example.com', password: 'not-a-real-password' });
  });

  it('returns the user UUID and the access token', async () => {
    const { connection } = connectionAnswering(loggedIn());
    expect(await login(connection)).toEqual(SESSION);
  });

  it('throws a BringError with the status and reports it for a wrong password', async () => {
    const { connection } = connectionAnswering(
      jsonResponse({ message: 'email password combination not existing' }, 401),
    );
    const error = await login(connection).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(BringError);
    expect(error).toMatchObject({ status: 401 });
    expect((error as Error).message).toContain('email password combination not existing');
    expect(reportError).toHaveBeenCalledWith(error, {
      'bring.operation': 'login',
      'bring.status': 401,
    });
  });

  it('never puts the password in the error', async () => {
    const { connection } = connectionAnswering(new Response('Invalid Email.', { status: 400 }));
    const error = await login(connection).catch((caught: unknown) => caught);
    expect((error as Error).message).not.toContain('not-a-real-password');
  });

  it('throws when the answer has no token', async () => {
    const { connection } = connectionAnswering(jsonResponse({ uuid: SESSION.userUuid }));
    await expect(login(connection)).rejects.toThrow(BringError);
  });
});

describe('addItem', () => {
  it('puts the item on the list with the session', async () => {
    const { connection, fetch } = connectionAnswering(added());
    await addItem(connection, SESSION, { name: 'Mehl', specification: '500 g' });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`https://api.getbring.com/rest/v2/bringlists/${LIST_UUID}`);
    expect(init?.method).toBe('PUT');
    expect(init?.headers).toMatchObject({
      'X-BRING-USER-UUID': SESSION.userUuid,
      Authorization: `Bearer ${SESSION.accessToken}`,
    });
    expect(formOf(init)).toEqual({ purchase: 'Mehl', specification: '500 g' });
  });

  it('sends an empty specification for an item without amount', async () => {
    const { connection, fetch } = connectionAnswering(added());
    await addItem(connection, SESSION, { name: 'Salz' });
    expect(formOf(fetch.mock.calls[0][1])).toEqual({ purchase: 'Salz', specification: '' });
  });

  it('encodes names with special characters', async () => {
    const { connection, fetch } = connectionAnswering(added());
    await addItem(connection, SESSION, { name: 'Salz & Pfeffer', specification: '1 Prise' });
    expect(formOf(fetch.mock.calls[0][1])).toEqual({
      purchase: 'Salz & Pfeffer',
      specification: '1 Prise',
    });
  });

  it('throws a BringError and reports it when Bring says no', async () => {
    const { connection } = connectionAnswering(new Response('', { status: 503 }));
    await expect(addItem(connection, SESSION, { name: 'Mehl' })).rejects.toMatchObject({
      name: 'BringError',
      status: 503,
      message: 'Bring addItem failed with 503',
    });
    expect(reportError).toHaveBeenCalledOnce();
  });
});

describe('addItems', () => {
  it('logs in once and adds the items in order', async () => {
    const { connection, fetch } = connectionAnswering(loggedIn(), added(), added());
    await addItems(connection, [{ name: 'Mehl', specification: '500 g' }, { name: 'Eier' }]);

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(formOf(fetch.mock.calls[1][1]).purchase).toBe('Mehl');
    expect(formOf(fetch.mock.calls[2][1]).purchase).toBe('Eier');
  });

  it('adds nothing when the login fails', async () => {
    const { connection, fetch } = connectionAnswering(jsonResponse({}, 401));
    await expect(addItems(connection, [{ name: 'Mehl' }])).rejects.toThrow(BringError);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('stops at the first item Bring rejects', async () => {
    const { connection, fetch } = connectionAnswering(
      loggedIn(),
      new Response('', { status: 500 }),
    );
    await expect(addItems(connection, [{ name: 'Mehl' }, { name: 'Eier' }])).rejects.toThrow(
      BringError,
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
