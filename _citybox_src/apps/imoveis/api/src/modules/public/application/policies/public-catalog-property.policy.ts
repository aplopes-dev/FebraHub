import type { ApiPropertyStatus } from '../../../properties/domain/mappers/property-enum.mapper';

/** Status visíveis no catálogo público — só imóveis disponíveis no módulo. */
export const PUBLIC_CATALOG_PROPERTY_STATUSES: readonly ApiPropertyStatus[] = [
  'available',
];

export function isPublicCatalogPropertyStatus(
  status: ApiPropertyStatus,
): boolean {
  return status === 'available';
}
