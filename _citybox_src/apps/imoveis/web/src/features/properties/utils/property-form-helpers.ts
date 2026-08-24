import { EMPTY_PROPERTY } from '../data/mock-data';
import type { PropertyListing } from '../types';
import type { PropertyWriteInput } from '../services/properties-service';

/** Metadados para formulário de novo imóvel, sem id/mídia MinIO. */
export function propertyAsCreateTemplate(
  source: PropertyListing,
): PropertyListing {
  return {
    ...EMPTY_PROPERTY,
    name: source.name,
    city: source.city,
    state: source.state,
    type: source.type,
    units: source.units,
    cost: source.cost,
    status: 'available',
    occupiedUnits: undefined,
    listingType: source.listingType,
    negotiable: source.negotiable,
    bedrooms: source.bedrooms,
    floors: source.floors,
    sizeSqm: source.sizeSqm,
    yearBuilt: source.yearBuilt,
    address: source.address,
    country: source.country,
    zipCode: source.zipCode,
    mapCoordinate: source.mapCoordinate,
    typeCode: source.typeCode,
    description: source.description,
    highlights: source.highlights ? [...source.highlights] : [],
    agentId: source.agentId,
    photoUrls: [],
    documents: [],
    activeLeads: [],
    totalActiveLeads: 0,
    views: 0,
  };
}

export function listingToWriteInput(
  listing: PropertyListing,
  status: PropertyListing['status'] = listing.status,
): PropertyWriteInput {
  return {
    name: listing.name,
    city: listing.city,
    state: listing.state,
    type: listing.type,
    units: listing.units,
    cost: listing.cost,
    status,
    occupiedUnits:
      status === 'occupied' ? listing.occupiedUnits : undefined,
    listingType: listing.listingType,
    negotiable: listing.negotiable,
    bedrooms: listing.bedrooms,
    floors: listing.floors,
    sizeSqm: listing.sizeSqm,
    yearBuilt: listing.yearBuilt,
    address: listing.address,
    country: listing.country,
    zipCode: listing.zipCode,
    mapCoordinate: listing.mapCoordinate,
    typeCode: listing.typeCode ?? undefined,
    description: listing.description,
    highlights: listing.highlights ? [...listing.highlights] : undefined,
    views: listing.views,
    activeLeads: listing.activeLeads,
    totalActiveLeads: listing.totalActiveLeads,
    agentId: listing.agentId,
  };
}
