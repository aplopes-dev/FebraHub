import { photosInCoverOrder } from './photos-in-cover-order';

describe('photosInCoverOrder', () => {
  it('puts the lowest sortOrder first even if the array is unsorted', () => {
    const photos = [
      { id: 'b', sortOrder: 1 },
      { id: 'c', sortOrder: 2 },
      { id: 'a', sortOrder: 0 },
    ];
    expect(photosInCoverOrder(photos).map((photo) => photo.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});
