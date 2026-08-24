import type { SxProps, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { listifyShadows } from './tokens';

/**
 * Neutraliza o fundo azul/amarelo do autofill do Chromium/Safari.
 * Usa box-shadow inset (único jeito confiável de sobrescrever -webkit-autofill).
 */
export function listifyAutofillSurfaceStyles(
  background: string,
  textColor: string,
) {
  const fill = {
    WebkitBoxShadow: `0 0 0 1000px ${background} inset`,
    WebkitTextFillColor: textColor,
    caretColor: textColor,
    borderRadius: 'inherit',
    transition: 'background-color 99999s ease-in-out 0s',
  } as const;

  return {
    '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active':
      fill,
    '&:autofill, &:autofill:hover, &:autofill:focus, &:autofill:active': fill,
  } as const;
}

/** Superfície de input em páginas (leads, imóveis, settings). */
export const listifyPageFieldSx: SxProps<Theme> = (theme) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    minHeight: 48,
    bgcolor: theme.palette.secondary.light,
    color: theme.palette.text.primary,
    fontSize: '1rem',
    '& fieldset': { borderColor: theme.palette.secondary.light },
    '&:hover fieldset': { borderColor: theme.palette.divider },
    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
    '& .MuiOutlinedInput-input': {
      color: theme.palette.text.primary,
      WebkitTextFillColor: theme.palette.text.primary,
      ...listifyAutofillSurfaceStyles(
        theme.palette.secondary.light,
        theme.palette.text.primary,
      ),
    },
    '&.Mui-disabled': {
      bgcolor: theme.palette.secondary.main,
      '& .MuiOutlinedInput-input': {
        color: theme.palette.text.secondary,
        WebkitTextFillColor: theme.palette.text.secondary,
      },
    },
  },
});

export const listifyPageMultilineSx: SxProps<Theme> = (theme) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    bgcolor: theme.palette.secondary.light,
    color: theme.palette.text.primary,
    alignItems: 'flex-start',
    fontSize: '1rem',
    '& fieldset': { borderColor: theme.palette.secondary.light },
    '&:hover fieldset': { borderColor: theme.palette.divider },
    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
    '& .MuiOutlinedInput-input': {
      color: theme.palette.text.primary,
      WebkitTextFillColor: theme.palette.text.primary,
      ...listifyAutofillSurfaceStyles(
        theme.palette.secondary.light,
        theme.palette.text.primary,
      ),
    },
  },
});

export const listifyPageSelectSx: SxProps<Theme> = (theme) => ({
  height: 48,
  borderRadius: '12px',
  bgcolor: theme.palette.secondary.light,
  color: theme.palette.text.primary,
  fontSize: '1rem',
  '& .MuiSelect-select': {
    color: theme.palette.text.primary,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.secondary.light,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.divider,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
});

/** Paper glass do modal Imóveis — light e dark. */
export const listifyModalPaperSx: SxProps<Theme> = (theme) => ({
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  // `width: 100%` respeita o maxWidth do Dialog (sm/md/…); NÃO forçar maxWidth: 100%.
  width: '100%',
  maxHeight: '90vh',
  gap: 2.5,
  borderRadius: '28px',
  border:
    theme.palette.mode === 'dark'
      ? '1px solid rgba(255, 255, 255, 0.08)'
      : '1px solid rgba(255, 255, 255, 0.35)',
  bgcolor:
    theme.palette.mode === 'dark'
      ? 'rgba(26, 27, 37, 0.94)'
      : 'rgba(255, 255, 255, 0.42)',
  backdropFilter: 'blur(42.599998474121094px)',
  WebkitBackdropFilter: 'blur(42.599998474121094px)',
  boxShadow:
    theme.palette.mode === 'dark'
      ? listifyShadows.lg
      : '0px 2px 8.2px 0px #32323226',
  p: { xs: 2.5, sm: 3.5 },
  m: { xs: 1.5, sm: 2 },
  backgroundImage: 'none',
  overflowX: 'hidden',
  overflowY: 'hidden',
});

/**
 * Superfície elevada/contrastante — inputs, campos aninhados, pills, botões secundários.
 * Dark: `secondary.main` (greyscale 600); light: `background.paper`.
 */
export function listifyElevatedSurface(theme: Theme): string {
  return theme.palette.mode === 'dark'
    ? theme.palette.secondary.main
    : theme.palette.background.paper;
}

export const listifyElevatedSurfaceSx: SxProps<Theme> = (theme) => ({
  bgcolor: listifyElevatedSurface(theme),
});

/** Superfície elevada + borda sutil no dark (campos de modal/sheet). */
export function listifyElevatedSurfaceStyles(theme: Theme) {
  const isDark = theme.palette.mode === 'dark';
  return {
    bgcolor: listifyElevatedSurface(theme),
    ...(isDark
      ? {
          border: '1px solid',
          borderColor: alpha(theme.palette.common.white, 0.08),
        }
      : {}),
  } as const;
}

export function listifyModalFieldSurface(theme: Theme) {
  const isDark = theme.palette.mode === 'dark';
  return {
    ...listifyElevatedSurfaceStyles(theme),
    borderRadius: '16px',
    boxShadow: isDark ? listifyShadows.none : listifyShadows.xs,
  } as const;
}

/** Badge neutro de status (imóvel, lead, transação). */
export const listifyNeutralBadgeSx: SxProps<Theme> = (theme) => ({
  bgcolor: theme.palette.secondary.main,
  color: theme.palette.text.secondary,
});
