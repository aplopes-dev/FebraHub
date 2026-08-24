import type { SxProps, Theme } from '@mui/material/styles';

/** Sombra do Paper do painel (DashboardHeader / Panel). */
export const CATALOG_LISTIFY_SHADOW = '0 1px 2px rgba(16, 24, 40, 0.04)';
export const CATALOG_LISTIFY_SHADOW_HOVER = '0 4px 12px rgba(16, 24, 40, 0.08)';

/** Paper flutuante — mesmo contrato do topbar/cards do painel. */
export const catalogFloatingPaperSx: SxProps<Theme> = {
  borderRadius: { xs: '16px', sm: '20px' },
  border: 'none',
  bgcolor: 'background.paper',
  boxShadow: CATALOG_LISTIFY_SHADOW,
};

/** Botão circular do header (share, tema, voltar) — espelha HeaderIconButton. */
export const catalogHeaderIconButtonSx: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: { xs: 40, sm: 44, md: 56 },
  height: { xs: 40, sm: 44, md: 56 },
  borderRadius: '999px',
  color: 'text.primary',
  bgcolor: 'secondary.main',
  border: 0,
  textDecoration: 'none',
  cursor: 'pointer',
  '&:hover': { bgcolor: 'secondary.dark' },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
  },
};

export const catalogCardPaperSx: SxProps<Theme> = {
  position: 'relative',
  height: '100%',
  overflow: 'hidden',
  borderRadius: '20px',
  bgcolor: 'background.paper',
  border: 'none',
  boxShadow: CATALOG_LISTIFY_SHADOW,
  transition: 'box-shadow 0.15s',
  '&:hover': {
    boxShadow: CATALOG_LISTIFY_SHADOW_HOVER,
  },
};
