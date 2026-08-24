'use client';

import type { SxProps, Theme } from '@mui/material/styles';
import {
  listifyPageFieldSx,
  listifyPageMultilineSx,
} from '@/theme/listify-field-styles';

/** Inputs Listify nas abas do formulário de lead. */
export const leadTabFieldSx: SxProps<Theme> = listifyPageFieldSx;

export const leadTabMultilineSx: SxProps<Theme> = listifyPageMultilineSx;

export { listifyPrimary, listifyError, listifyWarning } from '@/theme/tokens';
