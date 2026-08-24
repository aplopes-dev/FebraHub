import type { SxProps, Theme } from '@mui/material/styles';
import {
  listifyAutofillSurfaceStyles,
  listifyModalFieldSurface,
} from '@/theme/listify-field-styles';

export { listifyModalFieldSurface as modalFieldSurface };

function modalAutofillSx(theme: Theme) {
  const isDark = theme.palette.mode === 'dark';
  return listifyAutofillSurfaceStyles(
    isDark ? theme.palette.secondary.main : theme.palette.background.paper,
    theme.palette.text.primary,
  );
}

/**
 * Campos de formulário do padrão de Modal Imóveis (referência: agenda /
 * “Adicionar compromisso”).
 *
 * Caixa sólida (`background.paper`), radius 16px, sombra xs no light.
 * Busca: pill (`borderRadius: 999`).
 */

export const modalNoOutline = {
  border: 'none',
  '&:hover': { border: 'none' },
  '&.Mui-focused': { border: 'none', borderWidth: 0 },
} as const;

function modalInputRootSx(theme: Theme) {
  const isDark = theme.palette.mode === 'dark';
  return {
    bgcolor: isDark ? 'transparent' : theme.palette.background.paper,
    fontSize: 15,
    fontWeight: 500,
    '& fieldset': modalNoOutline,
    '&:hover fieldset': modalNoOutline,
    '&.Mui-focused fieldset': modalNoOutline,
  };
}

/** Input / TextField de texto no modal. */
export const modalFieldRootSx: SxProps<Theme> = (theme) => ({
  width: '100%',
  ...listifyModalFieldSurface(theme),
  '& .MuiOutlinedInput-root': {
    height: 52,
    borderRadius: '16px',
    px: 2,
    ...modalInputRootSx(theme),
  },
  '& .MuiOutlinedInput-input': {
    py: 1.5,
    px: 0,
    ...modalAutofillSx(theme),
  },
  '& .MuiInputAdornment-root': {
    ml: 0,
    mr: 1.25,
  },
  '& .MuiInputLabel-root, & .MuiFormLabel-root': {
    display: 'none',
  },
});

/** Select no modal (sem label flutuante / notch). */
export const modalSelectFieldSx: SxProps<Theme> = (theme) => ({
  height: 52,
  px: 0.5,
  ...listifyModalFieldSurface(theme),
  fontSize: 15,
  fontWeight: 500,
  '& .MuiSelect-select': {
    py: 1.5,
    px: 1.5,
  },
  '& .MuiOutlinedInput-notchedOutline': modalNoOutline,
  '&:hover .MuiOutlinedInput-notchedOutline': modalNoOutline,
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': modalNoOutline,
});

/** DatePicker no modal. */
export const modalPickerFieldSx: SxProps<Theme> = (theme) => ({
  width: '100%',
  minWidth: 0,
  maxWidth: '100%',
  ...listifyModalFieldSurface(theme),
  '& .MuiPickersOutlinedInput-root': {
    height: 52,
    minHeight: 52,
    minWidth: 0,
    width: '100%',
    borderRadius: '16px',
    alignItems: 'center',
    px: 2,
    ...modalInputRootSx(theme),
  },
  '& .MuiPickersOutlinedInput-sectionsContainer, & .MuiPickersSectionList-root': {
    alignItems: 'center',
    display: 'flex',
    minWidth: 0,
    flex: 1,
    paddingTop: '0 !important',
    paddingBottom: '0 !important',
  },
  '& .MuiInputAdornment-root': {
    height: 'auto',
    maxHeight: 'none',
    margin: 0,
    ml: 0,
    mr: 1,
    alignItems: 'center',
    flexShrink: 0,
  },
  '& .MuiInputLabel-root, & .MuiFormLabel-root': {
    display: 'none',
  },
});

/** TimePicker no modal (label externo “Início”/“Fim”). */
export const modalTimeFieldSx: SxProps<Theme> = (theme) => ({
  width: '100%',
  minWidth: 0,
  maxWidth: '100%',
  ...listifyModalFieldSurface(theme),
  '& .MuiPickersOutlinedInput-root': {
    height: 52,
    minHeight: 52,
    minWidth: 0,
    width: '100%',
    borderRadius: '16px',
    alignItems: 'center',
    px: { xs: 1, sm: 1.5 },
    ...modalInputRootSx(theme),
  },
  '& .MuiPickersOutlinedInput-sectionsContainer, & .MuiPickersSectionList-root': {
    alignItems: 'center',
    display: 'flex',
    minWidth: 0,
    flex: 1,
    paddingTop: '0 !important',
    paddingBottom: '0 !important',
  },
  '& .MuiInputAdornment-root': {
    height: 'auto',
    maxHeight: 'none',
    margin: 0,
    alignItems: 'center',
    flexShrink: 0,
  },
  '& .MuiInputLabel-root, & .MuiFormLabel-root': {
    display: 'none',
  },
});

/** SearchInput / busca pill no modal. */
export const modalSearchFieldSx: SxProps<Theme> = (theme) => ({
  width: '100%',
  ...listifyModalFieldSurface(theme),
  borderRadius: '999px',
  '& .MuiOutlinedInput-root': {
    height: 48,
    borderRadius: '999px',
    px: 2,
    ...modalInputRootSx(theme),
  },
  '& .MuiOutlinedInput-input': {
    py: 1.25,
    px: 0,
    ...modalAutofillSx(theme),
  },
  '& .MuiInputAdornment-root': {
    ml: 0,
    mr: 1.25,
  },
});

/** Autocomplete pill no modal (mesma superfície da busca). */
export const modalAutocompleteFieldSx: SxProps<Theme> = (theme) => ({
  width: '100%',
  ...modalSearchFieldSx(theme),
  '& .MuiAutocomplete-inputRoot': {
    height: 48,
    borderRadius: '999px',
    py: 0,
    px: 2,
    ...modalInputRootSx(theme),
  },
});

/** Título de seção dentro do modal (“Escolher lead”, etc.). */
export const modalSectionTitleSx: SxProps<Theme> = {
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: '-0.01em',
  color: 'text.primary',
};

/** Label curto acima de campo (ex.: Início / Fim). */
export const modalFieldLabelSx: SxProps<Theme> = {
  fontSize: 13,
  fontWeight: 500,
  color: 'text.secondary',
  mb: 0.75,
};

/** Caixa de leitura no sheet/detalhe (mesma superfície dos campos do modal). */
export const modalDetailFieldSx: SxProps<Theme> = (theme) => ({
  ...listifyModalFieldSurface(theme),
  px: 2,
  py: 1.5,
  minHeight: 52,
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  width: '100%',
  boxSizing: 'border-box',
});
