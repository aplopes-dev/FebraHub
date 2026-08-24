'use client';

import { useRef } from 'react';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import type { SxProps, Theme } from '@mui/material/styles';
import { PROPERTY_TYPE_LABEL } from '@/features/shared/types';
import { formatCurrency } from '@/features/shared/utils/format';
import { catalogFloatingPaperSx } from '../utils/catalog-chrome-styles';
import { catalogHighlightTagClassName } from '../utils/catalog-flat-styles';
import { catalogGalleryPhotos } from '../utils/catalog-gallery-photos';
import { catalogDetailMainWithStickyClassName } from '../utils/catalog-safe-area';
import { CatalogHeader } from './catalog-header';
import { CatalogQuickLeadBanner } from './catalog-quick-lead-banner';
import { CatalogThemeScope } from './catalog-theme-scope';
import { CatalogWhatsAppButton } from './catalog-whatsapp-button';
import { PropertyDetailHeader } from './property-detail-header';
import { PropertyFeatures } from './property-features';
import { PropertyMapEmbed } from '@/features/properties/components/property-map-embed';
import { PublicLeadForm } from './public-lead-form';
import { LISTING_PURPOSE_LABEL, type AgentCatalog, type CatalogListing } from '../types';

type ListingDetailPageProps = {
  catalog: AgentCatalog;
  listing: CatalogListing;
};

/** Página individual do imóvel — leitura linear no mobile, ampla no desktop. */
export function ListingDetailPage({
  catalog,
  listing,
}: ListingDetailPageProps) {
  const contactRef = useRef<HTMLDivElement | null>(null);
  const photos = catalogGalleryPhotos(listing);

  const location = [listing.neighborhood, listing.city, listing.state]
    .filter(Boolean)
    .join(', ');

  const tags = [
    LISTING_PURPOSE_LABEL[listing.purpose],
    PROPERTY_TYPE_LABEL[listing.type],
    ...listing.highlights.slice(0, 4),
  ];

  const contactBlock =
    catalog.agent.leadFormCatalogEnabled !== false ? (
      <Box
        ref={contactRef}
        id="catalog-contact"
        sx={[
          catalogFloatingPaperSx,
          {
            p: { xs: 2.5, md: 3 },
            scrollMarginTop: 112,
          },
        ] as SxProps<Theme>}
      >
        <Typography
          component="h2"
          sx={{ fontSize: '1.0625rem', fontWeight: 600, mb: 0.75 }}
        >
          Agendar visita
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.875rem', mb: 2 }}>
          Atendimento direto com {catalog.agent.name}.
        </Typography>
        <PublicLeadForm
          agentSlug={catalog.agent.slug}
          listingId={listing.id}
          listingTitle={listing.title}
          compact
        />
      </Box>
    ) : (
      <Box ref={contactRef} id="catalog-contact" sx={{ scrollMarginTop: 96 }} />
    );

  return (
    <CatalogThemeScope accentColorId={catalog.agent.accentColorId}>
      {/* `overflow-x-clip` (não `hidden`, que quebraria o sticky da coluna de
          contato): impede que qualquer sobra horizontal alargue o viewport e
          desloque os elementos `fixed`. */}
      <Box
        sx={{
          display: 'flex',
          minHeight: '100svh',
          flexDirection: 'column',
          overflowX: 'clip',
          bgcolor: 'background.default',
        }}
      >
        <CatalogQuickLeadBanner propertyId={listing.id} />
        <CatalogHeader agent={catalog.agent} variant="bar" />

        <main
          className={`mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 pt-4 pb-5 md:px-5 md:pt-5 md:pb-8 ${catalogDetailMainWithStickyClassName}`}
        >
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 2.5, md: 4 },
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.15fr) minmax(0, 0.85fr)' },
              alignItems: 'start',
            }}
          >
            {/* `useFlexGap`: sem ele o Stack emite `& > * { margin: 0 }`, que vence
                em especificidade e anula o full-bleed do hero. */}
            <Stack spacing={2.5} useFlexGap sx={{ minWidth: 0 }}>
              <PropertyDetailHeader
                listing={listing}
                agentSlug={catalog.agent.slug}
                photos={photos}
              />

              <Stack spacing={1}>
                <Typography
                  component="h1"
                  sx={{
                    fontSize: { xs: '1.375rem', md: '1.75rem' },
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.25,
                  }}
                >
                  {listing.title}
                </Typography>
                {location ? (
                  <Typography
                    color="text.secondary"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: '0.875rem',
                    }}
                  >
                    <LocationOnOutlinedIcon sx={{ fontSize: 16 }} aria-hidden />
                    {location}
                  </Typography>
                ) : null}
                {listing.mapCoordinate ? (
                  <PropertyMapEmbed
                    mapCoordinate={listing.mapCoordinate}
                    title={`Mapa de ${listing.title}`}
                  />
                ) : null}
                <Typography
                  sx={{
                    fontSize: { xs: '1.5rem', md: '1.75rem' },
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: (theme) =>
                      theme.palette.mode === 'dark'
                        ? theme.palette.primary.light
                        : 'primary.main',
                  }}
                >
                  {formatCurrency(listing.price)}
                  {listing.purpose === 'rent' ? (
                    <Typography
                      component="span"
                      color="text.secondary"
                      sx={{ fontSize: '0.875rem', fontWeight: 500, ml: 0.5 }}
                    >
                      /mês
                    </Typography>
                  ) : null}
                </Typography>
              </Stack>

              <PropertyFeatures listing={listing} />

              {listing.parkingSpots > 0 ? (
                <Typography color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                  {listing.parkingSpots === 1
                    ? '1 vaga de estacionamento'
                    : `${listing.parkingSpots} vagas de estacionamento`}
                </Typography>
              ) : null}

              {tags.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <li
                      key={`${tag}-${index}`}
                      className={`inline-flex items-center rounded-full bg-secondary px-3 py-1.5 text-sm text-muted-foreground shadow-none ${catalogHighlightTagClassName}`}
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}

              <section className="space-y-2">
                <h2 className="text-lg font-semibold tracking-tight">Sobre o imóvel</h2>
                {listing.description.trim() ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {listing.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Descrição não informada.</p>
                )}
              </section>

              {listing.highlights.length > 0 ? (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold tracking-tight">Diferenciais</h2>
                  <ul className="flex flex-wrap gap-2">
                    {listing.highlights.map((highlight, index) => (
                      <li
                        key={`${highlight}-${index}`}
                        className={`inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm text-muted-foreground shadow-none ${catalogHighlightTagClassName}`}
                      >
                        <CheckOutlinedIcon
                          sx={{ fontSize: 16, color: 'success.main' }}
                          aria-hidden
                        />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </Stack>

            <Stack
              spacing={2.5}
              sx={{
                minWidth: 0,
                position: { md: 'sticky' },
                top: { md: '112px' },
              }}
            >
              {contactBlock}
            </Stack>
          </Box>
        </main>

        <CatalogWhatsAppButton
          variant="sticky-bar"
          phoneNumber={catalog.agent.phone}
          enabled={catalog.agent.whatsappCatalogEnabled}
          property={{
            title: listing.title,
            codeOrId: listing.id,
          }}
        />
      </Box>
    </CatalogThemeScope>
  );
}
