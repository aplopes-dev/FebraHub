'use client';

import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import { Box, Stack } from '@citybox/mui/atoms';
import {
  listifyPageFieldSx,
  listifyPageSelectSx,
} from '@/theme/listify-field-styles';
import {
  modalFieldRootSx,
  modalSearchFieldSx,
  modalSelectFieldSx,
} from '@/components/ui/modal/modal-form-styles';

/** Input de página (painel settings) — alinhado ao form de leads. */
export const SETTINGS_FIELD_SX: SxProps<Theme> = listifyPageFieldSx;

/** Select de página. */
export const SETTINGS_SELECT_SX: SxProps<Theme> = listifyPageSelectSx;

export {
  modalFieldRootSx as SETTINGS_MODAL_FIELD_SX,
  modalSelectFieldSx as SETTINGS_MODAL_SELECT_SX,
  modalSearchFieldSx as SETTINGS_MODAL_SEARCH_SX,
};

type SettingsFieldProps = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
};

/** Label externo + controle (padrão Listify de página). */
export function SettingsField({
  label,
  htmlFor,
  children,
  sx,
}: SettingsFieldProps) {
  return (
    <Stack spacing={0.75} sx={sx}>
      <Box
        component="label"
        htmlFor={htmlFor}
        sx={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'text.secondary',
        }}
      >
        {label}
      </Box>
      {children}
    </Stack>
  );
}
