import type { ReactNode } from 'react';
import { cn } from '@citybox/ui';

type PatientSheetSectionProps = {
  title?: string;
  bordered?: boolean;
  children: ReactNode;
};

export function PatientSheetSection({
  title,
  bordered = false,
  children,
}: PatientSheetSectionProps) {
  return (
    <section className={cn('space-y-4', bordered && 'border-t border-border/60 pt-5')}>
      {title ? <h3 className="text-base font-semibold text-foreground">{title}</h3> : null}
      {children}
    </section>
  );
}
