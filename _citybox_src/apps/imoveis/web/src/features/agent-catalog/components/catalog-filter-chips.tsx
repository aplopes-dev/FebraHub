'use client';

import { MenuItem, Select, Stack } from '@citybox/mui/atoms';
import type { Theme } from '@mui/material/styles';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { PROPERTY_TYPE_LABEL, type PropertyType } from '@/features/shared/types';
import { LISTING_PURPOSE_LABEL, type CatalogFilter } from '../types';

const PURPOSE_OPTIONS: readonly { value: CatalogFilter['purpose']; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'sale', label: LISTING_PURPOSE_LABEL.sale },
  { value: 'rent', label: LISTING_PURPOSE_LABEL.rent },
];

const TYPE_OPTIONS = Object.keys(PROPERTY_TYPE_LABEL) as PropertyType[];

const selectFieldSx = {
  minWidth: 0,
  flex: 1,
  borderRadius: '12px',
  bgcolor: (theme: Theme) => listifyElevatedSurface(theme),
  boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '& .MuiSelect-select': {
    py: 1.25,
    px: 1.5,
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
};

type CatalogFilterChipsProps = {
  filter: CatalogFilter;
  onPurposeChange: (purpose: CatalogFilter['purpose']) => void;
  onTypeChange: (type: CatalogFilter['type']) => void;
};

/**
 * Filtros de finalização e tipo — dropdowns (sem scroll lateral).
 * Mantém o nome do export por compatibilidade com home + “Ver mais”.
 */
export function CatalogFilterChips({
  filter,
  onPurposeChange,
  onTypeChange,
}: CatalogFilterChipsProps) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{ width: '100%', minWidth: 0 }}
      role="group"
      aria-label="Filtros de imóveis"
    >
      <Select
        id="catalog-filter-purpose"
        value={filter.purpose}
        onChange={(event) => {
          onPurposeChange(event.target.value as CatalogFilter['purpose']);
        }}
        displayEmpty
        fullWidth
        inputProps={{ 'aria-label': 'Finalidade' }}
        sx={selectFieldSx}
        renderValue={(value) => {
          const option = PURPOSE_OPTIONS.find((item) => item.value === value);
          return option ? `Finalidade: ${option.label}` : 'Finalidade';
        }}
      >
        {PURPOSE_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>

      <Select
        id="catalog-filter-type"
        value={filter.type}
        onChange={(event) => {
          onTypeChange(event.target.value as CatalogFilter['type']);
        }}
        displayEmpty
        fullWidth
        inputProps={{ 'aria-label': 'Tipo de imóvel' }}
        sx={selectFieldSx}
        renderValue={(value) => {
          if (value === 'all') return 'Tipo: Todos';
          return `Tipo: ${PROPERTY_TYPE_LABEL[value as PropertyType] ?? String(value)}`;
        }}
      >
        <MenuItem value="all">Todos os tipos</MenuItem>
        {TYPE_OPTIONS.map((type) => (
          <MenuItem key={type} value={type}>
            {PROPERTY_TYPE_LABEL[type]}
          </MenuItem>
        ))}
      </Select>
    </Stack>
  );
}
