'use client';

import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import KingBedOutlinedIcon from '@mui/icons-material/KingBedOutlined';
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import type { CatalogListing } from '../types';

type PropertyFeaturesProps = {
  listing: CatalogListing;
};

/** Três blocos acessíveis: dormitórios, banheiros e área. */
export function PropertyFeatures({ listing }: PropertyFeaturesProps) {
  const items = [
    {
      key: 'beds',
      Icon: KingBedOutlinedIcon,
      value: String(listing.bedrooms),
      label: listing.bedrooms === 1 ? 'Dormitório' : 'Dormitórios',
    },
    {
      key: 'baths',
      Icon: BathtubOutlinedIcon,
      value: String(listing.bathrooms),
      label: listing.bathrooms === 1 ? 'Banheiro' : 'Banheiros',
    },
    {
      key: 'area',
      Icon: SquareFootOutlinedIcon,
      value: listing.area > 0 ? String(listing.area) : '—',
      label: 'm²',
    },
  ] as const;

  return (
    <Box
      component="ul"
      aria-label="Características do imóvel"
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 1.25,
        listStyle: 'none',
        m: 0,
        p: 0,
      }}
    >
      {items.map(({ key, Icon, value, label }) => (
        <Box
          component="li"
          key={key}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.75,
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            px: 1.5,
            py: 1.75,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Icon sx={{ fontSize: 20 }} aria-hidden />
          </Box>
          <Stack spacing={0.15} sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>
              {value}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.6875rem', fontWeight: 500 }}>
              {label}
            </Typography>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
