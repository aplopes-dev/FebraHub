'use client';

import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import VillaOutlinedIcon from '@mui/icons-material/VillaOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { SearchInput } from '@citybox/mui/molecules';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { PROPERTY_TYPE_LABEL, type PropertyType } from '@/features/shared/types';
import { LISTING_PURPOSE_LABEL, type CatalogFilter } from '../types';

const TYPE_OPTIONS: readonly {
  value: PropertyType | 'all';
  label: string;
  Icon: SvgIconComponent;
}[] = [
  { value: 'all', label: 'Todos', Icon: HomeOutlinedIcon },
  { value: 'house', label: PROPERTY_TYPE_LABEL.house, Icon: HomeOutlinedIcon },
  { value: 'villa', label: PROPERTY_TYPE_LABEL.villa, Icon: VillaOutlinedIcon },
  {
    value: 'apartment',
    label: PROPERTY_TYPE_LABEL.apartment,
    Icon: ApartmentOutlinedIcon,
  },
  { value: 'land', label: PROPERTY_TYPE_LABEL.land, Icon: LandscapeOutlinedIcon },
  {
    value: 'commercial',
    label: PROPERTY_TYPE_LABEL.commercial,
    Icon: StorefrontOutlinedIcon,
  },
];

const PURPOSE_OPTIONS: readonly {
  value: CatalogFilter['purpose'];
  label: string;
}[] = [
  { value: 'all', label: 'Todos' },
  { value: 'sale', label: LISTING_PURPOSE_LABEL.sale },
  { value: 'rent', label: LISTING_PURPOSE_LABEL.rent },
];

type CatalogSearchFilterBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filter: CatalogFilter;
  onPurposeChange: (purpose: CatalogFilter['purpose']) => void;
  onTypeChange: (type: CatalogFilter['type']) => void;
  searchPlaceholder?: string;
};

/**
 * Busca + categorias circulares (tipo) + chips de finalidade.
 * Mantém os mesmos filtros server-side (`purpose` / `type` / `search`).
 */
export function CatalogSearchFilterBar({
  search,
  onSearchChange,
  filter,
  onPurposeChange,
  onTypeChange,
  searchPlaceholder = 'Buscar por bairro, cidade ou nome',
}: CatalogSearchFilterBarProps) {
  return (
    <Stack spacing={2} sx={{ minWidth: 0 }} role="search">
      <SearchInput
        placeholder={searchPlaceholder}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        sx={{ width: '100%' }}
        slotProps={{
          input: {
            'aria-label': searchPlaceholder,
            sx: {
              height: 48,
              borderRadius: '16px',
              bgcolor: (theme) => listifyElevatedSurface(theme),
            },
          },
        }}
      />

      <Box
        role="group"
        aria-label="Tipo de imóvel"
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          pb: 0.5,
          mx: -0.5,
          px: 0.5,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {TYPE_OPTIONS.map(({ value, label, Icon }) => {
          const selected = filter.type === value;
          return (
            <Box
              key={value}
              component="button"
              type="button"
              aria-pressed={selected}
              aria-label={label}
              onClick={() => onTypeChange(value)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.75,
                minWidth: 64,
                border: 0,
                bgcolor: 'transparent',
                cursor: 'pointer',
                p: 0.5,
                borderRadius: 2,
                color: selected ? 'primary.main' : 'text.secondary',
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: selected ? 'primary.main' : 'action.hover',
                  color: selected ? 'primary.contrastText' : 'text.secondary',
                  transition: 'background-color 0.15s, color 0.15s',
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                  },
                }}
              >
                <Icon sx={{ fontSize: 24 }} />
              </Box>
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: selected ? 600 : 500,
                  lineHeight: 1.2,
                  textAlign: 'center',
                  maxWidth: 72,
                }}
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Box
        role="group"
        aria-label="Finalidade"
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {PURPOSE_OPTIONS.map((option) => {
          const selected = filter.purpose === option.value;
          return (
            <Box
              key={option.value}
              component="button"
              type="button"
              aria-pressed={selected}
              onClick={() => onPurposeChange(option.value)}
              sx={{
                flexShrink: 0,
                minHeight: 44,
                px: 2,
                borderRadius: '999px',
                border: '1px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'primary.main' : 'background.paper',
                color: selected ? 'primary.contrastText' : 'text.secondary',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              {option.label}
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
}
