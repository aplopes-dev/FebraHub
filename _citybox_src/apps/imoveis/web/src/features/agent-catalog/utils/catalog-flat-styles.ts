import type { SxProps, Theme } from '@mui/material/styles';

/** Botões do catálogo público — sem sombra (flat). */
export const catalogFlatButtonSx: SxProps<Theme> = {
  boxShadow: 'none',
  '&:hover': {
    boxShadow: 'none',
  },
  '&:active': {
    boxShadow: 'none',
  },
  '&.Mui-focusVisible': {
    boxShadow: 'none',
  },
};

/** Classes utilitárias para pills/tags de destaque sem sombra. */
export const catalogHighlightTagClassName = 'shadow-none';
