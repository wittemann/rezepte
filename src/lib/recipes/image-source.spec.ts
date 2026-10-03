import { describe, expect, it } from 'vitest';
import { RECIPE_FIELDS } from './fields.ts';
import { findImageUrl, isAttachmentId, isPhotoType, sizedImageUrl } from './image-source.ts';

const fields = {
  [RECIPE_FIELDS.images]: [
    {
      id: 'attOne',
      type: 'image/jpeg',
      url: 'https://cdn.example.test/full-one',
      thumbnails: {
        small: { url: 'https://cdn.example.test/small-one' },
        large: { url: 'https://cdn.example.test/large-one' },
      },
    },
    { id: 'attTwo', type: 'image/png', url: 'https://cdn.example.test/full-two' },
    { id: 'attPdf', type: 'application/pdf', url: 'https://cdn.example.test/doc' },
    { id: 'attSvg', type: 'image/svg+xml', url: 'https://cdn.example.test/drawing' },
  ],
};

describe('sizedImageUrl', () => {
  it('adds the size, leaves the original as it is', () => {
    expect(sizedImageUrl('/img/recA/attB', 'large')).toBe('/img/recA/attB?size=large');
    expect(sizedImageUrl('/img/recA/attB', 'full')).toBe('/img/recA/attB');
  });
});

describe('findImageUrl', () => {
  it('returns the original or the thumbnail for the size', () => {
    expect(findImageUrl(fields, 'attOne', 'full')).toBe('https://cdn.example.test/full-one');
    expect(findImageUrl(fields, 'attOne', 'small')).toBe('https://cdn.example.test/small-one');
    expect(findImageUrl(fields, 'attOne', 'large')).toBe('https://cdn.example.test/large-one');
  });

  it('falls back to the original without a thumbnail', () => {
    expect(findImageUrl(fields, 'attTwo', 'small')).toBe('https://cdn.example.test/full-two');
  });

  it('finds nothing for an unknown ID, a non-image file or no attachments', () => {
    expect(findImageUrl(fields, 'attMissing', 'full')).toBeUndefined();
    expect(findImageUrl(fields, 'attPdf', 'full')).toBeUndefined();
    expect(findImageUrl(fields, 'attSvg', 'full')).toBeUndefined();
    expect(findImageUrl({}, 'attOne', 'full')).toBeUndefined();
    expect(findImageUrl({ [RECIPE_FIELDS.images]: 'oops' }, 'attOne', 'full')).toBeUndefined();
  });
});

describe('isPhotoType', () => {
  it('accepts raster photo formats, also with parameters', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp', 'IMAGE/JPEG', 'image/jpeg; q=1']) {
      expect(isPhotoType(type)).toBe(true);
    }
  });

  it('refuses SVG, other files and no type', () => {
    for (const type of ['image/svg+xml', 'text/html', 'application/pdf', '', null, undefined]) {
      expect(isPhotoType(type)).toBe(false);
    }
  });
});

describe('isAttachmentId', () => {
  it('accepts attachment IDs only', () => {
    expect(isAttachmentId('attAbc123')).toBe(true);
    expect(isAttachmentId('recAbc123')).toBe(false);
    expect(isAttachmentId('att/../x')).toBe(false);
  });
});
