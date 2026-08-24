'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import { usePatientAppointmentsQuery } from '../../../hooks/use-patient-appointments-query';
import {
  buildAgendaDateHref,
  formatPatientAppointmentStatus,
  formatPatientAppointmentWhen,
  getPatientAppointmentStatusTextClass,
} from '../../../lib/format-patient-appointment';
import { PatientAppointmentsDialog } from './patient-appointments-dialog';

const ABOUT_PANEL_CLASS = 'rounded-2xl border border-border/60 bg-card p-5';
const PREVIEW_PER_PAGE = 5;

type PatientAppointmentsCardProps = {
  patientId: string;
  className?: string;
};

export function PatientAppointmentsCard({
  patientId,
  className,
}: PatientAppointmentsCardProps) {
  const router = useRouter();
  const [allOpen, setAllOpen] = useState(false);
  const { items, meta, isLoading, isError } = usePatientAppointmentsQuery(patientId, {
    page: 1,
    perPage: PREVIEW_PER_PAGE,
  });

  const hasMore = meta.total > PREVIEW_PER_PAGE;

  return (
    <div className={cn('min-w-0', className)}>
      <section
        className={cn(ABOUT_PANEL_CLASS, 'flex min-h-0 flex-col')}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground"
            aria-hidden
          >
            <CalendarClock className="size-4" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Consultas</h3>
        </div>

        <div className="mt-3 flex min-h-0 flex-col gap-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Carregando consultas…
            </p>
          ) : isError ? (
            <p className="text-sm text-destructive">
              Não foi possível carregar as consultas.
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma consulta agendada.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 rounded-xl border border-border/50 bg-muted/15 px-3 py-2.5"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {formatPatientAppointmentWhen(item.date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.professionalDisplayName}
                    </p>
                  </div>
                  <p
                    className={cn(
                      'justify-self-center pt-0.5 text-center text-sm font-medium',
                      getPatientAppointmentStatusTextClass(item.status),
                    )}
                  >
                    {formatPatientAppointmentStatus(
                      item.status,
                      item.confirmationSource,
                    )}
                  </p>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-8 shrink-0 px-0 text-primary"
                      onClick={() => router.push(buildAgendaDateHref(item.date))}
                    >
                      Ver na Agenda
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {hasMore ? (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 text-primary"
                onClick={() => setAllOpen(true)}
              >
                Ver todas as consultas
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      <PatientAppointmentsDialog
        patientId={patientId}
        open={allOpen}
        onOpenChange={setAllOpen}
      />
    </div>
  );
}
