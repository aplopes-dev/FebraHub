'use client';

import Link from 'next/link';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import type { SxProps, Theme } from '@mui/material/styles';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { catalogFloatingPaperSx } from '../utils/catalog-chrome-styles';
import { getAgentCatalogListingsPath } from '@/features/shared/data/navigation';
import { usePublicCatalogListings } from '../hooks/use-public-catalog-listings';
import type { CatalogListingsMeta } from '../services/agent-catalog-mappers';
import { splitCatalogHomeListings } from '../utils/split-catalog-home-listings';
import { CatalogSearchFilterBar } from './catalog-search-filter-bar';
import { CatalogPropertyCard, PropertyCard } from './catalog-property-card';
import type { CatalogFilter, CatalogListing } from '../types';

type CatalogListingsProps = {
  agentSlug: string;
  initialListings: readonly CatalogListing[];
  initialMeta: CatalogListingsMeta;
};

function seeMoreHref(
  agentSlug: string,
  filter: CatalogFilter,
  search: string,
): string {
  const base = getAgentCatalogListingsPath(agentSlug);
  const params = new URLSearchParams();
  if (filter.purpose !== 'all') params.set('purpose', filter.purpose);
  if (filter.type !== 'all') params.set('type', filter.type);
  const q = search.trim();
  if (q) params.set('q', q);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * Home pública: busca/categorias, recomendados (página 1 sem filtro) e
 * ListifyPagination no padrão do restante do sistema.
 */
export function CatalogListings({
  agentSlug,
  initialListings,
  initialMeta,
}: CatalogListingsProps) {
  const {
    filter,
    search,
    searchTerm,
    page,
    perPage,
    listings,
    meta,
    isLoading,
    perPageOptions,
    handlePurposeChange,
    handleTypeChange,
    handleSearchChange,
    setPage,
    handlePerPageChange,
  } = usePublicCatalogListings({
    agentSlug,
    initialListings,
    initialMeta,
  });

  const isHomeTeaser =
    page === 1 &&
    filter.purpose === 'all' &&
    filter.type === 'all' &&
    searchTerm === '';

  const { recommended, nearby } = isHomeTeaser
    ? splitCatalogHomeListings(listings)
    : { recommended: [] as const, nearby: listings };

  const total = meta.total;
  const totalLabel =
    isLoading && listings.length === 0
      ? 'Carregando…'
      : total === 1
        ? '1 imóvel disponível'
        : `${total} imóveis disponíveis`;
  const seeMoreUrl = seeMoreHref(agentSlug, filter, search);
  const showEmpty = !isLoading && listings.length === 0;
  const showGrid = !isHomeTeaser && nearby.length > 0;

  return (
    <Stack spacing={{ xs: 3, md: 4 }} component="section">
      <div className="space-y-1">
        <Typography
          component="h2"
          sx={{
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          Encontre seu imóvel
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ fontSize: '0.875rem' }}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {totalLabel}
        </Typography>
      </div>

      <CatalogSearchFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        filter={filter}
        onPurposeChange={handlePurposeChange}
        onTypeChange={handleTypeChange}
      />

      {isLoading && listings.length === 0 ? (
        <HomeSkeleton />
      ) : showEmpty ? (
        <Box
          sx={[
            catalogFloatingPaperSx,
            { px: { xs: 2.5, md: 3 }, py: { xs: 6, md: 8 }, textAlign: 'center' },
          ] as SxProps<Theme>}
        >
          <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Nenhum imóvel encontrado com esses filtros. Fale com a corretora para receber opções fora
            da vitrine.
          </Typography>
        </Box>
      ) : (
        <>
          {recommended.length > 0 ? (
            <section className="space-y-3" aria-labelledby="catalog-recommended-heading">
              <div className="flex items-end justify-between gap-3">
                <Typography
                  id="catalog-recommended-heading"
                  component="h3"
                  sx={{ fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.01em' }}
                >
                  Imóveis recomendados
                </Typography>
                <Link
                  href={seeMoreUrl}
                  className="min-h-[44px] inline-flex items-center text-sm font-semibold text-primary"
                >
                  Ver todos
                </Link>
              </div>
              <div className="flex items-stretch gap-3 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:snap-none">
                {recommended.map((listing) => (
                  <PropertyCard
                    key={listing.id}
                    listing={listing}
                    agentSlug={agentSlug}
                    variant="recommended"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {isHomeTeaser && nearby.length > 0 ? (
            <section className="space-y-3" aria-labelledby="catalog-nearby-heading">
              <Typography
                id="catalog-nearby-heading"
                component="h3"
                sx={{ fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.01em' }}
              >
                Próximos imóveis
              </Typography>
              <ul className="flex flex-col gap-2.5 md:grid md:grid-cols-2 md:items-stretch lg:grid-cols-3 md:gap-3">
                {nearby.map((listing) => (
                  <li key={listing.id} className="min-w-0 h-full">
                    <PropertyCard
                      listing={listing}
                      agentSlug={agentSlug}
                      variant="nearby"
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {showGrid ? (
            <Box
              component="ul"
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(0, 1fr))',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                  lg: 'repeat(4, minmax(0, 1fr))',
                },
                columnGap: { xs: 1, sm: 1.5 },
                rowGap: { xs: 1.25, sm: 1.5 },
                alignItems: 'stretch',
                listStyle: 'none',
                m: 0,
                p: 0,
              }}
            >
              {nearby.map((listing) => (
                <Box
                  component="li"
                  key={listing.id}
                  sx={{ minWidth: 0, height: '100%', display: 'flex' }}
                >
                  <CatalogPropertyCard listing={listing} agentSlug={agentSlug} />
                </Box>
              ))}
            </Box>
          ) : null}
        </>
      )}

      <ListifyPagination
        count={meta.total}
        page={meta.page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={handlePerPageChange}
        rowsPerPageOptions={perPageOptions}
      />
    </Stack>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando imóveis">
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-64 w-60 shrink-0 animate-pulse rounded-[20px] bg-secondary motion-reduce:animate-none"
          />
        ))}
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-28 w-full animate-pulse rounded-[20px] bg-secondary motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}
