'use client';

import { useState } from 'react';
import { cn } from '@citybox/ui';
import { useCan } from '@/features/clinic/permissions';
import {
  formatPatientAnamnesisAlertsCount,
  usePatientAnamnesisAlertsQuery,
} from '../../hooks/use-patient-anamnesis-queries';

type PatientAnamnesisAlertsBadgeProps = {
  patientId: string;
  className?: string;
};

export function PatientAnamnesisAlertsBadge({
  patientId,
  className,
}: PatientAnamnesisAlertsBadgeProps) {
  const canManageAnamnesis = useCan('manage', 'PatientAnamnesis');
  const [open, setOpen] = useState(false);
  const { data: alerts = [] } = usePatientAnamnesisAlertsQuery(
    canManageAnamnesis ? patientId : null,
  );

  if (!canManageAnamnesis || alerts.length === 0) {
    return null;
  }

  return (
    <div
      className={cn('relative shrink-0', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 text-sm font-semibold text-destructive transition-colors hover:bg-muted/60"
        aria-label={`${formatPatientAnamnesisAlertsCount(alerts.length)} da anamnese`}
        aria-expanded={open}
      >
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-white"
          aria-hidden
        >
          !
        </span>
        {formatPatientAnamnesisAlertsCount(alerts.length)}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 rounded-xl border border-border/60 bg-card p-4 shadow-lg"
          role="tooltip"
        >
          <span
            className="absolute -top-1.5 right-6 size-3 rotate-45 border-l border-t border-border/60 bg-card"
            aria-hidden
          />
          <h3 className="text-sm font-semibold text-destructive">Alertas da Anamnese</h3>
          <ul className="mt-3 space-y-2">
            {alerts.map((alert) => (
              <li key={alert.id} className="flex gap-2 text-sm text-foreground">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground" aria-hidden />
                <span>{alert.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
