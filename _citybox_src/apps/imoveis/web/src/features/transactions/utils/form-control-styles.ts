import type { SxProps, Theme } from '@mui/material/styles';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';

/** Campos de formulário do módulo de transações/financeiro. */
export const controlSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    height: 44,
    borderRadius: 6,
    bgcolor: (theme) => listifyElevatedSurface(theme),
  },
};

/** DatePicker do `@citybox/mui` — mesma densidade dos demais controles. */
export const pickerControlSx: SxProps<Theme> = {
  width: '100%',
  '& .MuiPickersOutlinedInput-root': {
    height: 44,
    minHeight: 44,
    borderRadius: 6,
    bgcolor: (theme) => listifyElevatedSurface(theme),
  },
};

export const selectControlSx: SxProps<Theme> = {
  ...controlSx,
  width: '100%',
};

export const searchInputSx: SxProps<Theme> = {
  ...controlSx,
  maxWidth: '100%',
};

/** Botões outline sobre fundo da página precisam de superfície. */
export const outlineButtonSx: SxProps<Theme> = (theme) => ({
  borderRadius: 999,
  bgcolor: listifyElevatedSurface(theme),
});

/** Mesmo que `outlineButtonSx`, com altura padrão de campo (44px). */
export const outlineButtonMdSx: SxProps<Theme> = (theme) => ({
  ...outlineButtonSx(theme),
  height: 44,
});
