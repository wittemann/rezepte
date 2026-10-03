import { ActionError } from 'astro:actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reportError } from '../lib/monitoring.ts';
import { withGenericErrors } from './with-generic-errors.ts';

vi.mock('../lib/monitoring.ts', () => ({ reportError: vi.fn() }));

beforeEach(() => vi.mocked(reportError).mockClear());

describe('withGenericErrors', () => {
  it('passes input and result through', async () => {
    const handler = withGenericErrors('test', async (input: number) => input * 2);
    expect(await handler(21)).toBe(42);
    expect(reportError).not.toHaveBeenCalled();
  });

  it('replaces an unexpected error with a generic one and reports the original', async () => {
    const original = new Error('Airtable GET /v0/appSecretBase/tblTable failed with 500');
    const handler = withGenericErrors('saveRecipe', async () => {
      throw original;
    });

    const thrown = await handler(undefined).catch((error: unknown) => error);
    expect(thrown).toBeInstanceOf(ActionError);
    expect(thrown).toMatchObject({ code: 'INTERNAL_SERVER_ERROR', message: 'The action failed' });
    expect(reportError).toHaveBeenCalledExactlyOnceWith(original, { action: 'saveRecipe' });
  });

  it('passes ActionErrors on unchanged', async () => {
    const notFound = new ActionError({ code: 'NOT_FOUND', message: 'Recipe not found' });
    const handler = withGenericErrors('setFavorite', async () => {
      throw notFound;
    });

    await expect(handler(undefined)).rejects.toBe(notFound);
    expect(reportError).not.toHaveBeenCalled();
  });
});
