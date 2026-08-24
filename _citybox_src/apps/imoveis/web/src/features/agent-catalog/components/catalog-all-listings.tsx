'use client';

import { Box, Stack, Typography } from '@citybox/mui/atoms';
import type { SxProps, Theme } from '@mui/material/styles';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { usePublicCatalogListings } from '../hooks/use-public-catalog-listings';
import type { CatalogListingsMeta } from '../services/agent-catalog-mappers';
import { catalogFloatingPaperSx } from '../utils/catalog-chrome-styles';
import { CatalogSearchFilterBar } from './catalog-search-filter-bar';
import { CatalogPropertyCard } from './catalog-property-card';
import type { CatalogFilter, CatalogListing } from '../types';

type CatalogAllListingsProps = {
  agentSlug: string;
  initialListings: readonly CatalogListing[];
  initialMeta: CatalogListingsMeta;
  initialFilter?: CatalogFilter;
  initialSearch?: string;
};

/**
 * Página “Ver mais” — grade de imóveis com os mesmos filtros da home.
 */
export function CatalogAllListings({
  agentSlug,
  initialListings,
  initialMeta,
  initialFilter = { purpose: 'all', type: 'all' },
  initialSearch = '',
}: CatalogAllListingsProps) {
  const {
    filter,
    search,
    listings,
    meta,
    isLoading,
    perPage,
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
    initialFilter,
    initialSearch,
  });

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <CatalogSearchFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        filter={filter}
        onPurposeChange={handlePurposeChange}
        onTypeChange={handleTypeChange}
        searchPlaceholder="Buscar imóvel…"
      />

      <Stack
        direction="row"
        sx={{
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Typography
          color="text.secondary"
          sx={{ fontSize: '0.8125rem' }}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {isLoading && listings.length === 0
            ? 'Carregando…'
            : meta.total === 1
              ? '1 imóvel'
              : `${meta.total} imóveis`}
        </Typography>
      </Stack>

      {isLoading && listings.length === 0 ? (
        <Box
          sx={[
            catalogFloatingPaperSx,
            { px: 3, py: 8, textAlign: 'center' },
          ] as SxProps<Theme>}
        >
          <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Carregando imóveis…
          </Typography>
        </Box>
      ) : listings.length === 0 ? (
        <Box
          sx={[
            catalogFloatingPaperSx,
            { px: 3, py: 8, textAlign: 'center' },
          ] as SxProps<Theme>}
        >
          <Typography sx={{ fontWeight: 500 }}>Nenhum imóvel encontrado</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.875rem' }}>
            Ajuste a busca ou os filtros.
          </Typography>
        </Box>
      ) : (
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
          {listings.map((listing) => (
            <Box
              component="li"
              key={listing.id}
              sx={{ minWidth: 0, height: '100%', display: 'flex' }}
            >
              <CatalogPropertyCard listing={listing} agentSlug={agentSlug} />
            </Box>
          ))}
        </Box>
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
