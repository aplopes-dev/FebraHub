import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { paginateItems } from './paginate-items';

describe('paginateItems', () => {
  it('returns the requested slice without mutating the source', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const first = paginateItems(items, 1, 8);
    assert.deepEqual(first.pageItems, [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.equal(first.total, 9);
    assert.equal(first.page, 1);

    const second = paginateItems(items, 2, 8);
    assert.deepEqual(second.pageItems, [9]);
    assert.equal(second.page, 2);
    assert.deepEqual(items, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('clamps an out-of-range page', () => {
    const result = paginateItems(['a', 'b'], 9, 8);
    assert.deepEqual(result.pageItems, ['a', 'b']);
    assert.equal(result.page, 1);
  });
});
