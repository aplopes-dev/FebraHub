import type { Metadata } from 'next';
import { PublicClinicThemeShell } from './public-clinic-theme-shell';

export const metadata: Metadata = {
  title: 'Clínica',
};

export default function PublicClinicLayout({ children }: { children: React.ReactNode }) {
  return <PublicClinicThemeShell>{children}</PublicClinicThemeShell>;
}
