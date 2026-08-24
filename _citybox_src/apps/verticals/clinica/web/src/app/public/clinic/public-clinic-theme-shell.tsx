'use client';

import type { CSSProperties, ReactNode } from 'react';
import { CLINIC_THEME } from '@/features/clinic/lib/theme';

const clinicThemeStyle = {
  '--primary': `hsl(${CLINIC_THEME.primaryHsl})`,
  '--primary-foreground': `hsl(${CLINIC_THEME.primaryForegroundHsl})`,
  '--primary-dark': `hsl(${CLINIC_THEME.primaryDarkHsl})`,
  '--ring': `hsl(${CLINIC_THEME.primaryHsl})`,
} as CSSProperties;

type PublicClinicThemeShellProps = {
  children: ReactNode;
};

export function PublicClinicThemeShell({ children }: PublicClinicThemeShellProps) {
  return (
    <div
      data-vertical="clinic"
      style={clinicThemeStyle}
      className="min-h-svh bg-background text-foreground"
    >
      {children}
    </div>
  );
}
