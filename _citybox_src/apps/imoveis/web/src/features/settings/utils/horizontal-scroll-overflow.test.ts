import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readHorizontalScrollOverflow } from './horizontal-scroll-overflow';

describe('readHorizontalScrollOverflow', () => {
  it('hides both hints when content fits', () => {
    const overflow = readHorizontalScrollOverflow({
      scrollLeft: 0,
      scrollWidth: 200,
      clientWidth: 200,
    });
    assert.deepEqual(overflow, { canScrollStart: false, canScrollEnd: false });
  });

  it('shows the end hint at the start of an overflowing row', () => {
    const overflow = readHorizontalScrollOverflow({
      scrollLeft: 0,
      scrollWidth: 400,
      clientWidth: 200,
    });
    assert.deepEqual(overflow, { canScrollStart: false, canScrollEnd: true });
  });

  it('shows both hints in the middle', () => {
    const overflow = readHorizontalScrollOverflow({
      scrollLeft: 80,
      scrollWidth: 400,
      clientWidth: 200,
    });
    assert.deepEqual(overflow, { canScrollStart: true, canScrollEnd: true });
  });

  it('shows only the start hint at the end', () => {
    const overflow = readHorizontalScrollOverflow({
      scrollLeft: 200,
      scrollWidth: 400,
      clientWidth: 200,
    });
    assert.deepEqual(overflow, { canScrollStart: true, canScrollEnd: false });
  });
});
