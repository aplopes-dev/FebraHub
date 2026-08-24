import type { SxProps, Theme } from '@mui/material/styles';
import {
  listifyPageFieldSx,
  listifyPageMultilineSx,
  listifyPageSelectSx,
} from '@/theme/listify-field-styles';

/** Inputs Listify do formulário de imóvel (Figma 18105:17040). */
export const propertyFormFieldSx: SxProps<Theme> = listifyPageFieldSx;

export const propertyFormSelectSx: SxProps<Theme> = listifyPageSelectSx;

/** Status "Disponível" — fundo mint + borda teal (Figma). */
export const propertyStatusSelectAvailableSx: SxProps<Theme> = (theme) => ({
  height: 48,
  borderRadius: '12px',
  bgcolor: theme.palette.success.light,
  fontSize: '1rem',
  color: theme.palette.success.main,
  fontWeight: 500,
  '& .MuiSelect-icon': { color: theme.palette.success.main },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.success.main,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.success.dark,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.success.main,
  },
});

export const propertyFormMultilineSx: SxProps<Theme> = listifyPageMultilineSx;

export { listifyError, listifyPrimary, listifySuccess } from '@/theme/tokens';
