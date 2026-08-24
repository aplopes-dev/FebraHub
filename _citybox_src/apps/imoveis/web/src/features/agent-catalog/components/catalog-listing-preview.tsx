'use client';

import type { ReactNode } from 'react';
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import CropFreeOutlinedIcon from '@mui/icons-material/CropFreeOutlined';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import KingBedOutlinedIcon from '@mui/icons-material/KingBedOutlined';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { PropertyImage } from '@/components/ui/property-image';
import { PROPERTY_TYPE_LABEL } from '@/features/shared/types';
import { formatCurrency } from '@/features/shared/utils/format';
import { LISTING_PURPOSE_LABEL, type CatalogListing } from '../types';

type CatalogListingPreviewProps = {
  listing: CatalogListing;
  /**
   * Foto da capa na prévia — 1ª da galeria no detalhe do catálogo.
   * Se omitida, usa `coverPhotoUrl` e depois `photoUrls[0]`.
   */
  previewPhotoUrl?: string;
  /** Clique na capa (abre galeria / visualizador no detalhe). */
  onCoverClick?: () => void;
};

/**
 * Prévia do imóvel no estilo do módulo Imóveis (foto maior + infos).
 * Usada na **página individual** do catálogo público (desktop e mobile).
 */
export function CatalogListingPreview({
  listing,
  previewPhotoUrl,
  onCoverClick,
}: CatalogListingPreviewProps) {
  const cover =
    previewPhotoUrl ?? listing.coverPhotoUrl ?? listing.photoUrls?.[0];
  const location = [listing.neighborhood, listing.city, listing.state]
    .filter(Boolean)
    .join(', ');
  const priceLabel = formatCurrency(listing.price);

  return (
    <Panel
      sx={{
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        gap: 2.75,
        p: 3,
        borderRadius: '20px',
        bgcolor: 'background.paper',
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontSize: '1.125rem',
          fontWeight: 500,
          letterSpacing: '-0.02em',
          lineHeight: 1.4,
        }}
      >
        Prévia do imóvel
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          p: 2.5,
          borderRadius: '20px',
          bgcolor: 'secondary.light',
          boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
        }}
      >
        <Box
          component={onCoverClick ? 'button' : 'div'}
          type={onCoverClick ? 'button' : undefined}
          onClick={onCoverClick}
          aria-label={onCoverClick ? 'Ver fotos em tamanho grande' : undefined}
          sx={{
            position: 'relative',
            height: { xs: 200, md: 220 },
            width: '100%',
            flexShrink: 0,
            overflow: 'hidden',
            borderRadius: '12px',
            bgcolor: 'secondary.main',
            border: 0,
            p: 0,
            display: 'block',
            cursor: onCoverClick ? 'zoom-in' : 'default',
          }}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={`Foto de ${listing.title}`}
              className="size-full object-cover"
            />
          ) : (
            <PropertyImage seed={listing.id} alt={`Ilustração de ${listing.title}`} />
          )}
          <Box
            component="span"
            sx={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              borderRadius: '999px',
              bgcolor: listing.purpose === 'sale' ? 'primary.main' : 'info.main',
              color: 'primary.contrastText',
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          >
            {LISTING_PURPOSE_LABEL[listing.purpose]}
          </Box>
        </Box>

        <Stack spacing={0.5}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-start' }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: '1.125rem',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {listing.title}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 300,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {location || 'Localização'}
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexShrink: 0,
                py: 0.5,
              }}
            >
              <CropFreeOutlinedIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography
                color="text.secondary"
                sx={{ fontSize: '0.75rem', fontWeight: 300 }}
              >
                {listing.area > 0 ? `${listing.area} m²` : '—'}
              </Typography>
            </Stack>
          </Stack>

          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
          >
            <Typography
              sx={{
                fontSize: '1.5rem',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                lineHeight: 1.5,
              }}
            >
              {priceLabel}
              {listing.purpose === 'rent' ? (
                <Typography
                  component="span"
                  color="text.secondary"
                  sx={{ fontSize: '0.875rem', fontWeight: 400, ml: 0.5 }}
                >
                  /mês
                </Typography>
              ) : null}
            </Typography>
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                borderRadius: '12px',
                bgcolor: 'secondary.main',
                px: 1,
                py: 0.5,
              }}
            >
              <Typography
                color="text.secondary"
                sx={{ fontSize: '0.75rem', fontWeight: 500 }}
              >
                {PROPERTY_TYPE_LABEL[listing.type]}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={2}
            sx={{
              mt: 0.5,
              pt: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              flexWrap: 'wrap',
            }}
          >
            <Spec
              icon={<KingBedOutlinedIcon sx={{ fontSize: 16 }} />}
              label={`${listing.bedrooms} dorm.`}
            />
            <Spec
              icon={<BathtubOutlinedIcon sx={{ fontSize: 16 }} />}
              label={`${listing.bathrooms} banh.`}
            />
            <Spec
              icon={<DirectionsCarOutlinedIcon sx={{ fontSize: 16 }} />}
              label={`${listing.parkingSpots} vaga${listing.parkingSpots === 1 ? '' : 's'}`}
            />
          </Stack>
        </Stack>
      </Box>
    </Panel>
  );
}

function Spec({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Typography
      color="text.secondary"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        fontSize: '0.75rem',
        fontWeight: 500,
      }}
    >
      {icon}
      {label}
    </Typography>
  );
}
