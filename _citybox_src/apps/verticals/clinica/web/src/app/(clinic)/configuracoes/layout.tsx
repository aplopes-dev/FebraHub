import type { ReactNode } from 'react';
import { ClinicSettingsNav } from '@/features/clinic/components/clinic-settings-nav';

export default function ClinicSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="-m-4 min-h-[calc(100%+2rem)] shrink-0 bg-[color-mix(in_oklch,var(--foreground)_6%,var(--background))] p-4">
      <ClinicSettingsNav />
      <div className="pt-6">{children}</div>
    </div>
  );
}
