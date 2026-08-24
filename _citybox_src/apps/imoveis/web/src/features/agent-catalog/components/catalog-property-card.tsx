'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { SxProps, Theme } from '@mui/material/styles';
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import KingBedOutlinedIcon from '@mui/icons-material/KingBedOutlined';
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { PropertyImage } from '@/components/ui/property-image';
import { PROPERTY_TYPE_LABEL } from '@/features/shared/types';
import { formatCurrency } from '@/features/shared/utils/format';
import { getAgentCatalogPath } from '@/features/shared/data/navigation';
import { catalogCardPaperSx } from '../utils/catalog-chrome-styles';
import { LISTING_PURPOSE_LABEL, type CatalogListing } from '../types';

export type PropertyCardVariant = 'recommended' | 'nearby' | 'grid';

type PropertyCardProps = {
  listing: CatalogListing;
  agentSlug: string;
  variant?: PropertyCardVariant;
};

function listingHref(agentSlug: string, listingId: string) {
  return `${getAgentCatalogPath(agentSlug)}/listings/${listingId}`;
}

const META_LINE_SX = {
  fontSize: '0.6875rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minHeight: '1.125rem',
  lineHeight: 1.4,
  flexShrink: 0,
} as const;

const TITLE_CLAMP_SX = {
  fontWeight: 600,
  letterSpacing: '-0.01em',
  lineHeight: 1.3,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  minHeight: 'calc(1.3em * 2)',
  flexShrink: 0,
} as const;

export function ListingPrice({ listing }: { listing: CatalogListing }) {
  const feesLabel =
    listing.monthlyFees !== undefined
      ? `+ ${formatCurrency(listing.monthlyFees)} cond. / IPTU`
      : '\u00a0';

  return (
    <Box sx={{ minHeight: '2.75rem' }}>
      <Typography
        component="strong"
        sx={{
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: { xs: '1rem', sm: '1.125rem' },
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }}
      >
        {formatCurrency(listing.price)}
        {listing.purpose === 'rent' ? (
          <Typography
            component="span"
            color="text.secondary"
            sx={{ fontSize: '0.75rem', fontWeight: 400 }}
          >
            {' '}
            /mês
          </Typography>
        ) : null}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '0.6875rem',
        }}
        aria-hidden={listing.monthlyFees === undefined}
      >
        {feesLabel}
      </Typography>
    </Box>
  );
}

function CoverMedia({
  listing,
  radius = '12px',
}: {
  listing: CatalogListing;
  radius?: string;
}) {
  const cover = listing.coverPhotoUrl ?? listing.photoUrls?.[0];
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: radius,
        bgcolor: 'secondary.main',
      }}
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt=""
          className="size-full object-cover"
        />
      ) : (
        <PropertyImage seed={listing.id} alt="" />
      )}
      <Box
        component="span"
        sx={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          borderRadius: '999px',
          bgcolor: listing.purpose === 'sale' ? 'primary.main' : 'primary.dark',
          color: 'primary.contrastText',
          px: 1,
          py: 0.25,
          fontSize: '0.625rem',
          fontWeight: 600,
          lineHeight: 1.4,
        }}
      >
        {LISTING_PURPOSE_LABEL[listing.purpose]}
      </Box>
    </Box>
  );
}

function SpecsRow({ listing }: { listing: CatalogListing }) {
  const items = [
    listing.bedrooms > 0
      ? { key: 'beds', Icon: KingBedOutlinedIcon, label: `${listing.bedrooms}` }
      : null,
    { key: 'baths', Icon: BathtubOutlinedIcon, label: `${listing.bathrooms}` },
    listing.area > 0
      ? { key: 'area', Icon: SquareFootOutlinedIcon, label: `${listing.area}m²` }
      : null,
  ].filter(Boolean) as {
    key: string;
    Icon: typeof KingBedOutlinedIcon;
    label: string;
  }[];

  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{
        alignItems: 'center',
        flexWrap: 'nowrap',
        minHeight: '1.125rem',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {items.map(({ key, Icon, label }) => (
        <Typography
          key={key}
          color="text.secondary"
          aria-label={
            key === 'beds'
              ? `${label} dormitórios`
              : key === 'baths'
                ? `${label} banheiros`
                : `${label.replace('m²', '')} metros quadrados`
          }
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.35,
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          <Icon sx={{ fontSize: 14 }} aria-hidden />
          <span aria-hidden>{label}</span>
        </Typography>
      ))}
    </Stack>
  );
}

function CardShell({
  href,
  title,
  sx,
  children,
}: {
  href: string;
  title: string;
  sx?: SxProps<Theme>;
  children: ReactNode;
}) {
  return (
    <Box
      component="article"
      sx={[catalogCardPaperSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    >
      <Box
        component={Link}
        href={href}
        aria-label={`Abrir ${title}`}
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          borderRadius: 'inherit',
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
      />
      <Box sx={{ pointerEvents: 'none', position: 'relative', zIndex: 1, height: '100%' }}>
        {children}
      </Box>
    </Box>
  );
}

/** Card reutilizável do catálogo — variantes home (recomendado/próximos) e grade. */
export function PropertyCard({
  listing,
  agentSlug,
  variant = 'grid',
}: PropertyCardProps) {
  const href = listingHref(agentSlug, listing.id);
  const location = [listing.neighborhood, listing.city].filter(Boolean).join(', ');

  if (variant === 'recommended') {
    return (
      <CardShell
        href={href}
        title={listing.title}
        sx={{
          width: { xs: 260, md: '100%' },
          flexShrink: { xs: 0, md: 1 },
          minWidth: { md: 0 },
          maxWidth: { md: 'none' },
          scrollSnapAlign: { xs: 'start', md: 'unset' },
        }}
      >
        <Stack sx={{ height: '100%', minHeight: 44, p: 1.5, gap: 1.25 }}>
          <Box sx={{ aspectRatio: '4 / 3', width: '100%', flexShrink: 0 }}>
            <CoverMedia listing={listing} radius="12px" />
          </Box>
          <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
            <Typography color="text.secondary" sx={META_LINE_SX}>
              {PROPERTY_TYPE_LABEL[listing.type]} · {location}
            </Typography>
            <Typography
              component="h3"
              sx={{ ...TITLE_CLAMP_SX, fontSize: '0.9375rem' }}
            >
              {listing.title}
            </Typography>
            <Box sx={{ mt: 'auto', pt: 0.5 }}>
              <ListingPrice listing={listing} />
            </Box>
            <SpecsRow listing={listing} />
          </Stack>
        </Stack>
      </CardShell>
    );
  }

  if (variant === 'nearby') {
    return (
      <CardShell href={href} title={listing.title} sx={{ width: '100%', minWidth: 0 }}>
        <Stack direction="row" spacing={1.5} sx={{ minHeight: 44, p: 1.5 }}>
          <Box sx={{ width: 112, height: 112, flexShrink: 0 }}>
            <CoverMedia listing={listing} radius="12px" />
          </Box>
          <Stack
            spacing={0.5}
            sx={{ minWidth: 0, flex: 1, py: 0.25, overflow: 'hidden' }}
          >
            <Typography color="text.secondary" sx={META_LINE_SX}>
              {PROPERTY_TYPE_LABEL[listing.type]} · {listing.neighborhood}
            </Typography>
            <Typography
              component="h3"
              sx={{ ...TITLE_CLAMP_SX, fontSize: '0.875rem' }}
            >
              {listing.title}
            </Typography>
            <Box sx={{ mt: 'auto' }}>
              <ListingPrice listing={listing} />
            </Box>
            <SpecsRow listing={listing} />
          </Stack>
        </Stack>
      </CardShell>
    );
  }

  return (
    <CardShell href={href} title={listing.title} sx={{ width: '100%', minWidth: 0 }}>
      <Stack sx={{ height: '100%', minHeight: 44, p: { xs: 1.25, sm: 1.5 }, gap: 1.25 }}>
        <Box sx={{ aspectRatio: '4 / 3', width: '100%', flexShrink: 0 }}>
          <CoverMedia listing={listing} radius="12px" />
        </Box>
        <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
          <Typography color="text.secondary" sx={META_LINE_SX}>
            {PROPERTY_TYPE_LABEL[listing.type]} · {listing.neighborhood}
          </Typography>
          <Typography
            component="h3"
            sx={{ ...TITLE_CLAMP_SX, fontSize: '0.875rem' }}
          >
            {listing.title}
          </Typography>
          <Box sx={{ mt: 'auto', pt: 0.5 }}>
            <ListingPrice listing={listing} />
          </Box>
          <SpecsRow listing={listing} />
        </Stack>
      </Stack>
    </CardShell>
  );
}

/** Alias — listagem “Ver mais” usa o mesmo card em grade. */
export function CatalogPropertyCard({
  listing,
  agentSlug,
}: {
  listing: CatalogListing;
  agentSlug: string;
}) {
  return <PropertyCard listing={listing} agentSlug={agentSlug} variant="grid" />;
}
