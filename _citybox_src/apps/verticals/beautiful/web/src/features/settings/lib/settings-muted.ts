import type { SxProps, Theme } from '@mui/material/styles';

/** Equivalente a `text-muted-foreground` da Clínica (`oklch`). */
export function mutedForeground(theme: Theme): string {
  return theme.palette.mode === 'dark' ? 'oklch(0.708 0 0)' : 'oklch(0.556 0 0)';
}

/** Texto secundário: `text-sm text-muted-foreground`. */
export const settingsMutedTextSx = {
  fontSize: '0.875rem',
  lineHeight: 1.25,
  color: (theme: Theme) => mutedForeground(theme),
} satisfies SxProps<Theme>;

export const settingsFieldLabelSx = (error?: boolean) =>
  ({
    display: 'block',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.43,
    color: error ? 'error.main' : ((theme: Theme) => mutedForeground(theme)),
  }) satisfies SxProps<Theme>;

/** Placeholder e label flutuante em muted; valor digitado permanece `text.primary`. */
export const settingsInputSx = {
  '& .MuiInputLabel-root:not(.Mui-error)': {
    color: (theme: Theme) => mutedForeground(theme),
  },
  '& .MuiFormLabel-root:not(.Mui-error):not(.Mui-focused)': {
    color: (theme: Theme) => mutedForeground(theme),
  },
  '& .MuiInputBase-input::placeholder': {
    color: (theme: Theme) => mutedForeground(theme),
    opacity: 1,
  },
  '& .MuiPickersInputBase-root, & .MuiPickersSectionList-root': {
    color: 'text.primary',
  },
} satisfies SxProps<Theme>;
