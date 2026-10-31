// TEMPORARY spike for docs/decisions/0014-bring-shopping-list.md: does a Vercel function get to
// log in to Bring and add an item to the family list? Remove once the ADR is decided.
// GET shows a button, POST adds the item „Spike-Test“. The login is checked by the middleware;
// Astro's origin check (security.checkOrigin, on by default) rejects cross-site form posts.
import type { APIRoute } from 'astro';
import { BRING_EMAIL, BRING_LIST_UUID, BRING_PASSWORD } from 'astro:env/server';

const API_URL = 'https://api.getbring.com/rest/v2';
// Public headers of Bring's web app, as sent by the community client bring-shopping 2.0.1
const BRING_HEADERS = {
  'X-BRING-API-KEY': 'cof4Nc6D8saplXjE3h3HXqHH8m7VU2i1Gs0g85Sp',
  'X-BRING-CLIENT': 'webApp',
  'X-BRING-CLIENT-SOURCE': 'webApp',
  'X-BRING-COUNTRY': 'DE',
};

const FORM = `<!doctype html>
<meta name="viewport" content="width=device-width">
<title>Bring spike</title>
<form method="post"><button>Add „Spike-Test“ to the Bring list</button></form>`;

export const GET: APIRoute = () => htmlResponse(FORM);

export const POST: APIRoute = async () => {
  if (!BRING_EMAIL || !BRING_PASSWORD || !BRING_LIST_UUID) {
    return textResponse('Missing BRING_EMAIL, BRING_PASSWORD or BRING_LIST_UUID.');
  }

  const loginResponse = await fetch(`${API_URL}/bringauth`, {
    method: 'POST',
    headers: BRING_HEADERS,
    body: new URLSearchParams({ email: BRING_EMAIL, password: BRING_PASSWORD }),
  });
  if (!loginResponse.ok) {
    return textResponse(`Login failed: ${loginResponse.status} ${await loginResponse.text()}`);
  }
  const login = (await loginResponse.json()) as { uuid: string; access_token: string };

  const addResponse = await fetch(`${API_URL}/bringlists/${BRING_LIST_UUID}`, {
    method: 'PUT',
    headers: {
      ...BRING_HEADERS,
      'X-BRING-USER-UUID': login.uuid,
      Authorization: `Bearer ${login.access_token}`,
    },
    body: new URLSearchParams({ purchase: 'Spike-Test', specification: 'bitte löschen' }),
  });
  if (!addResponse.ok) {
    return textResponse(
      `Login OK, adding failed: ${addResponse.status} ${await addResponse.text()}`,
    );
  }
  return textResponse(`Login OK, item added (${addResponse.status}). Check the Bring app.`);
};

function htmlResponse(body: string) {
  return new Response(body, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store' },
  });
}

function textResponse(body: string) {
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'private, no-store' },
  });
}
