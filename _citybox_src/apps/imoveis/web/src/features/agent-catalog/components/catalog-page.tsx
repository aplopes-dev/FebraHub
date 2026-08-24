'use client';

import { Box } from '@citybox/mui/atoms';
import { CatalogFooter } from './catalog-footer';
import { CatalogHeader } from './catalog-header';
import { CatalogListings } from './catalog-listings';
import { CatalogThemeScope } from './catalog-theme-scope';
import { CatalogWhatsAppButton } from './catalog-whatsapp-button';
import type { AgentCatalogPage } from '../services/agent-catalog-service';

/** Página pública do corretor — o link que ele divulga para os clientes. */
export function CatalogPage({ catalog }: { catalog: AgentCatalogPage }) {
  return (
    <CatalogThemeScope accentColorId={catalog.agent.accentColorId}>
      <Box
        sx={{
          display: 'flex',
          minHeight: '100svh',
          flexDirection: 'column',
          overflowX: 'clip',
          bgcolor: 'background.default',
        }}
      >
        <CatalogHeader agent={catalog.agent} />

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
            pb: { xs: 2.5, md: 4 },
          }}
        >
          <CatalogListings
            agentSlug={catalog.agent.slug}
            initialListings={catalog.listings}
            initialMeta={
              catalog.listingsMeta ?? {
                total: catalog.listings.length,
                page: 1,
                perPage: catalog.listings.length,
                totalPages: 1,
              }
            }
          />
        </Box>

        <CatalogFooter agent={catalog.agent} />
        {/* Home: FAB sempre quando há telefone. Toggle da loja vale só na página do imóvel. */}
        <CatalogWhatsAppButton phoneNumber={catalog.agent.phone} />
      </Box>
    </CatalogThemeScope>
  );
}
