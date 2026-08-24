import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { splitCatalogHomeListings } from './split-catalog-home-listings';
import type { CatalogListing } from '../types';

function listing(id: string): CatalogListing {
  return {
    id,
    title: id,
    purpose: 'sale',
    type: 'house',
    price: 100000,
    bedrooms: 2,
    bathrooms: 1,
    parkingSpots: 1,
    area: 80,
    neighborhood: 'Centro',
    city: 'Ilhéus',
    state: 'BA',
    description: '',
    highlights: [],
  };
}

describe('splitCatalogHomeListings', () => {
  it('puts first N items in recommended and the rest in nearby', () => {
    const listings = [1, 2, 3, 4, 5, 6].map((n) => listing(`p${n}`));
    const sections = splitCatalogHomeListings(listings, 4);
    assert.deepEqual(
      sections.recommended.map((item) => item.id),
      ['p1', 'p2', 'p3', 'p4'],
    );
    assert.deepEqual(
      sections.nearby.map((item) => item.id),
      ['p5', 'p6'],
    );
  });

  it('handles fewer listings than recommended count', () => {
    const listings = [listing('only')];
    const sections = splitCatalogHomeListings(listings, 4);
    assert.equal(sections.recommended.length, 1);
    assert.equal(sections.nearby.length, 0);
  });

  it('does not mutate the input array', () => {
    const listings = [listing('a'), listing('b')];
    const before = listings.map((item) => item.id);
    splitCatalogHomeListings(listings, 1);
    assert.deepEqual(
      listings.map((item) => item.id),
      before,
    );
  });
});
