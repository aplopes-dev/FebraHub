import type { SxProps, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import {
  CATALOG_PHOTO_TILE_GAP_PX,
  CATALOG_PHOTO_TILE_SIZE_PX,
} from '@/features/shared/utils/catalog-gallery-display';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';

/** Grade das galerias de fotos (form + catálogo público). */
export const photoGalleryGridSx = {
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, ${CATALOG_PHOTO_TILE_SIZE_PX}px)`,
  gap: `${CATALOG_PHOTO_TILE_GAP_PX}px`,
  alignItems: 'start',
} as const;

/** Moldura da foto — tokens de tema (sem greyscale fixo do light). */
export const photoTileSx: SxProps<Theme> = (theme) => ({
  position: 'relative',
  boxSizing: 'border-box',
  width: CATALOG_PHOTO_TILE_SIZE_PX,
  height: CATALOG_PHOTO_TILE_SIZE_PX,
  flexShrink: 0,
  overflow: 'hidden',
  borderRadius: '20px',
  border: '2px solid',
  borderColor:
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.1)
      : theme.palette.divider,
  bgcolor:
    theme.palette.mode === 'dark'
      ? theme.palette.secondary.light
      : theme.palette.secondary.main,
  color: theme.palette.text.primary,
});

function photoActionTileCore(theme: Theme) {
  return {
    boxSizing: 'border-box' as const,
    display: 'flex',
    width: CATALOG_PHOTO_TILE_SIZE_PX,
    height: CATALOG_PHOTO_TILE_SIZE_PX,
    flexShrink: 0,
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    border: '2px dashed',
    borderColor:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.common.white, 0.18)
        : theme.palette.divider,
    borderRadius: '20px',
    px: 2,
    py: 2,
    margin: 0,
    font: 'inherit',
    color: theme.palette.text.primary,
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    transition: theme.transitions.create(['background-color', 'border-color'], {
      duration: theme.transitions.duration.shorter,
    }),
    '&:disabled': {
      opacity: 0.7,
    },
  };
}

/** Botão “Mais fotos” — superfície elevada, legível no dark. */
export const photoActionTileBaseSx: SxProps<Theme> = (theme) => ({
  ...photoActionTileCore(theme),
  bgcolor: listifyElevatedSurface(theme),
  '&:hover': {
    bgcolor:
      theme.palette.mode === 'dark'
        ? theme.palette.secondary.dark
        : theme.palette.secondary.main,
    borderColor:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.common.white, 0.28)
        : theme.palette.text.disabled,
  },
});

/** Variante outline (“Enviar foto”) — fundo transparente. */
export const photoActionTileOutlineSx: SxProps<Theme> = (theme) => ({
  ...photoActionTileCore(theme),
  bgcolor: 'transparent',
  '&:hover': {
    bgcolor:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.common.white, 0.06)
        : listifyElevatedSurface(theme),
  },
});

export const photoActionIconCircleSx: SxProps<Theme> = (theme) => ({
  display: 'inline-flex',
  width: 56,
  height: 56,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  bgcolor:
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.08)
      : theme.palette.secondary.main,
  color: theme.palette.text.secondary,
  '& .MuiSvgIcon-root': {
    color: 'inherit',
  },
});

export const photoOpenButtonSx: SxProps<Theme> = {
  display: 'block',
  width: '100%',
  height: '100%',
  border: 0,
  p: 0,
  m: 0,
  cursor: 'zoom-in',
  bgcolor: 'transparent',
  color: 'inherit',
  appearance: 'none',
  WebkitAppearance: 'none',
  lineHeight: 0,
  overflow: 'hidden',
  '& img': {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
};
