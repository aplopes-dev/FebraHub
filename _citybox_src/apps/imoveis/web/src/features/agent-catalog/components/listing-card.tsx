'use client';

import type { CatalogListing } from '../types';
import { ListingPrice, PropertyCard } from './catalog-property-card';

export { ListingPrice };

type ListingCardProps = {
  listing: CatalogListing;
  agentSlug: string;
};

/** @deprecated Prefer `PropertyCard` — mantido para imports existentes. */
export function ListingCard({ listing, agentSlug }: ListingCardProps) {
  return <PropertyCard listing={listing} agentSlug={agentSlug} variant="grid" />;
}
