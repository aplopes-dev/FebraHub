import type { CatalogListing } from '../types';
import { CATALOG_RECOMMENDED_COUNT } from '../services/agent-catalog-mappers';

export type CatalogHomeSections = {
  recommended: readonly CatalogListing[];
  nearby: readonly CatalogListing[];
};

/**
 * “Recomendados” = primeiros resultados da ordenação atual da API.
 * “Próximos” = restantes da mesma fatia (sem geolocalização).
 */
export function splitCatalogHomeListings(
  listings: readonly CatalogListing[],
  recommendedCount = CATALOG_RECOMMENDED_COUNT,
): CatalogHomeSections {
  return {
    recommended: listings.slice(0, recommendedCount),
    nearby: listings.slice(recommendedCount),
  };
}
