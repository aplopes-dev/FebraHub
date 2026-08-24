import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PropertyPhotoDraft } from '../services/properties-service';
import {
  draftsFromPhotoUrls,
  firstNewPhotoPath,
  markPhotoUploadFailed,
  markPhotoUploaded,
  movePhotoToFront,
  photoIdsInFormOrder,
  reorderPhotosByKeys,
} from './property-media-save';

describe('movePhotoToFront', () => {
  it('moves the chosen index to capa position', () => {
    assert.deepEqual(movePhotoToFront(['a', 'b', 'c'], 2), ['c', 'a', 'b']);
  });

  it('returns a copy when index is already capa', () => {
    const items = ['a', 'b'];
    const next = movePhotoToFront(items, 0);
    assert.deepEqual(next, ['a', 'b']);
    assert.notEqual(next, items);
  });
});

describe('reorderPhotosByKeys', () => {
  it('applies dnd order without dropping unknown keys', () => {
    const photos = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];
    assert.deepEqual(reorderPhotosByKeys(photos, ['c', 'a', 'b']), [
      { key: 'c' },
      { key: 'a' },
      { key: 'b' },
    ]);
  });
});

describe('markPhotoUploaded', () => {
  it('replaces the local draft with the persisted path and drops the file', () => {
    const photos: PropertyPhotoDraft[] = [
      { key: 'local-1', file: new File(['x'], 'a.webp', { type: 'image/webp' }) },
      { key: 'keep', path: '/v1/properties/p/photos/old' },
    ];
    const next = markPhotoUploaded(
      photos,
      'local-1',
      '/v1/properties/p/photos/new-id',
    );
    assert.equal(next[0]?.path, '/v1/properties/p/photos/new-id');
    assert.equal(next[0]?.file, undefined);
    assert.equal(next[0]?.uploadFailed, undefined);
    assert.equal(next[1]?.key, 'keep');
  });
});

describe('markPhotoUploadFailed', () => {
  it('flags only the failed draft', () => {
    const photos: PropertyPhotoDraft[] = [
      { key: 'a' },
      { key: 'b' },
    ];
    const next = markPhotoUploadFailed(photos, 'b');
    assert.equal(next[0]?.uploadFailed, undefined);
    assert.equal(next[1]?.uploadFailed, true);
  });
});

describe('photoIdsInFormOrder', () => {
  it('collects persisted photo ids in form order', () => {
    const photos: PropertyPhotoDraft[] = [
      { key: '1', path: '/v1/properties/p/photos/aaa' },
      { key: 'local', file: new File(['x'], 'x.webp', { type: 'image/webp' }) },
      { key: '2', path: '/v1/properties/p/photos/bbb' },
    ];
    assert.deepEqual(photoIdsInFormOrder(photos), ['aaa', 'bbb']);
  });
});

describe('draftsFromPhotoUrls', () => {
  it('rebuilds drafts in API cover order', () => {
    assert.deepEqual(
      draftsFromPhotoUrls([
        '/v1/properties/p/photos/c',
        '/v1/properties/p/photos/a',
      ]),
      [
        { key: '/v1/properties/p/photos/c', path: '/v1/properties/p/photos/c' },
        { key: '/v1/properties/p/photos/a', path: '/v1/properties/p/photos/a' },
      ],
    );
  });
});

describe('firstNewPhotoPath', () => {
  it('returns the path that appeared after upload', () => {
    const previous = new Set(['/v1/properties/p/photos/a']);
    assert.equal(
      firstNewPhotoPath(previous, [
        '/v1/properties/p/photos/a',
        '/v1/properties/p/photos/b',
      ]),
      '/v1/properties/p/photos/b',
    );
  });
});
