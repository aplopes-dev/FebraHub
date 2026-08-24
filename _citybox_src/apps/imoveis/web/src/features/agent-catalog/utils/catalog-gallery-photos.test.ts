import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { catalogGalleryPhotos } from './catalog-gallery-photos';

describe('catalogGalleryPhotos', () => {
  it('puts cover first even if photoUrls still has the old order', () => {
    assert.deepEqual(
      catalogGalleryPhotos({
        coverPhotoUrl: '/cover.webp',
        photoUrls: ['/old.webp', '/cover.webp', '/other.webp'],
      }),
      ['/cover.webp', '/old.webp', '/other.webp'],
    );
  });

  it('falls back to cover when the gallery is empty', () => {
    assert.deepEqual(
      catalogGalleryPhotos({ coverPhotoUrl: '/cover.webp' }),
      ['/cover.webp'],
    );
  });
});
