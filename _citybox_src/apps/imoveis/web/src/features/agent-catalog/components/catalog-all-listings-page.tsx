'use client';

import { Box } from '@citybox/mui/atoms';
import { CatalogAllListings } from './catalog-all-listings';
import { CatalogListingsIdentityHeader } from './catalog-listings-identity-header';
import { CatalogThemeScope } from './catalog-theme-scope';
import { CatalogWhatsAppButton } from './catalog-whatsapp-button';
import type { CatalogListingsMeta } from '../services/agent-catalog-mappers';
import type { Agent, CatalogFilter, CatalogListing } from '../types';

type CatalogAllListingsPageProps = {
  agent: Agent;
  listings: readonly CatalogListing[];
  listingsMeta: CatalogListingsMeta;
  initialFilter?: CatalogFilter;
  initialSearch?: string;
};

/**
 * Página dedicada só de imóveis (Ver mais): identidade compacta + grade.
 * Sem cabeçalho completo do catálogo nem footer de lead.
 */
export function CatalogAllListingsPage({
  agent,
  listings,
  listingsMeta,
  initialFilter,
  initialSearch,
}: CatalogAllListingsPageProps) {
  return (
    <CatalogThemeScope accentColorId={agent.accentColorId}>
      <Box
        sx={{
          display: 'flex',
          minHeight: '100svh',
          flexDirection: 'column',
          overflowX: 'clip',
          bgcolor: 'background.default',
        }}
      >
        <CatalogListingsIdentityHeader agent={agent} />

        <Box
          component="main"
          sx={{
            mx: 'auto',
            width: '100%',
            maxWidth: 1152,
            minWidth: 0,
            flex: 1,
            px: { xs: 2, md: 2.5 },
            pt: { xs: 2, md: 2.5 },
            pb: { xs: 2.5, md: 3 },
          }}
        >
          <CatalogAllListings
            agentSlug={agent.slug}
            initialListings={listings}
            initialMeta={listingsMeta}
            initialFilter={initialFilter}
            initialSearch={initialSearch}
          />
        </Box>

        {/* Listagem: FAB sempre quando há telefone. Toggle da loja vale só na página do imóvel. */}
        <CatalogWhatsAppButton phoneNumber={agent.phone} />
      </Box>
    </CatalogThemeScope>
  );
}
