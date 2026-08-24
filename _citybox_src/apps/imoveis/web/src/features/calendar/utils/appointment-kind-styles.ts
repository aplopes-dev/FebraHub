import type { Theme } from '@mui/material/styles';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import type { AppointmentKind } from '../types';

/** Sombra neutra para destacar cards sobre o fundo da grade. */
export const APPOINTMENT_CARD_SHADOW =
  '0 1px 2px rgba(13, 13, 18, 0.06), 0 0 0 1px rgba(13, 13, 18, 0.03)';

export type AppointmentKindSurface = {
  bg: string;
  border: string;
  accent: string;
};

/** Superfície neutra — grade e lista (sem cor por tipo). */
export function getAppointmentKindSurface(theme: Theme): AppointmentKindSurface {
  return {
    bg: listifyElevatedSurface(theme),
    border: theme.palette.divider,
    accent: theme.palette.secondary.dark,
  };
}

export function getAppointmentKindSurfaces(
  theme: Theme,
): Record<AppointmentKind, AppointmentKindSurface> {
  const surface = getAppointmentKindSurface(theme);
  return {
    visit: surface,
    'follow-up': surface,
    signing: surface,
    other: surface,
  };
}
