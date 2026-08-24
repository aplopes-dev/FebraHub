'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleAlert, Plus } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@citybox/ui/atoms';
import type { IReturnAlert } from '@/features/clinic/agenda/components/header/return-alert/types';
import {
  useDeleteReturnAlert,
  useReturnAlerts,
} from '@/features/clinic/agenda/hooks/use-return-alerts';
import { buildReturnAlertSchedulingIntent } from '@/features/clinic/agenda/lib/build-return-alert-scheduling-intent';
import { storeSchedulingSheetIntent } from '@/features/clinic/agenda/lib/scheduling-sheet-intent';
import { useTeamMembers } from '@/features/shared/team';
import { PatientReturnAlertCard } from './patient-return-alert-card';
import { PatientReturnAlertFormDialog } from './patient-return-alert-form-dialog';

const CLINIC_AGENDA_HREF = '/agenda';

type PatientReturnAlertsPopoverProps = {
  patientId: string;
  patientName: string;
  patientPhone?: string | null;
  patientPhotoUrl?: string | null;
  patientCategoryName?: string | null;
  className?: string;
};

export function PatientReturnAlertsPopover({
  patientId,
  patientName,
  patientPhone,
  patientPhotoUrl,
  patientCategoryName,
  className,
}: PatientReturnAlertsPopoverProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const { members } = useTeamMembers();
  const professionalNameById = useMemo(
    () => new Map(members.map((member) => [member.id, member.name])),
    [members],
  );

  const { data, isLoading, isError, refetch } = useReturnAlerts({
    patientId,
    perPage: 100,
  });

  const { mutate: deleteAlert } = useDeleteReturnAlert();

  useEffect(() => {
    if (open) {
      void refetch();
    }
  }, [open, refetch]);

  const alerts = data?.alerts ?? [];
  const hasAlerts = alerts.length > 0;

  const handleDelete = (alert: IReturnAlert) => {
    deleteAlert(alert.id, {
      onSuccess: () => {
        void refetch();
      },
    });
  };

  const handleSchedule = (alert: IReturnAlert) => {
    setOpen(false);
    storeSchedulingSheetIntent(
      buildReturnAlertSchedulingIntent({
        alert,
        patientCategoryName,
      }),
    );
    router.push(CLINIC_AGENDA_HREF);
  };

  const resolveProfessionalName = (alert: IReturnAlert) =>
    professionalNameById.get(alert.professional.id) ||
    alert.professional.name ||
    'Profissional';

  return (
    <>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn('shrink-0', className)}
            aria-label="Alertas de retorno"
          >
            <CircleAlert className="size-4" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="flex h-[301.33px] w-[672px] flex-col overflow-hidden p-0"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/60 px-4 py-3">
            <div className="min-w-0 space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">Alertas de retorno</h3>
              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? 'Carregando alertas...'
                  : hasAlerts
                    ? `${alerts.length} alerta(s) de retorno cadastrado(s).`
                    : 'Este paciente não possui alertas de retorno.'}
              </p>
            </div>
            <Button
              type="button"
              size="icon"
              className="size-8 shrink-0 rounded-lg"
              aria-label="Adicionar alerta de retorno"
              onClick={() => setFormDialogOpen(true)}
            >
              <Plus className="size-4" aria-hidden />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {isLoading ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Carregando...
              </p>
            ) : isError ? (
              <p className="flex h-full items-center justify-center text-sm text-destructive">
                Não foi possível carregar os alertas de retorno.
              </p>
            ) : !hasAlerts ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhum alerta de retorno cadastrado para este paciente.
              </p>
            ) : (
              <ul className="space-y-3">
                {alerts.map((alert) => (
                  <PatientReturnAlertCard
                    key={alert.id}
                    alert={alert}
                    patientName={patientName}
                    patientPhone={patientPhone}
                    patientPhotoUrl={patientPhotoUrl}
                    professionalName={resolveProfessionalName(alert)}
                    onSchedule={handleSchedule}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <PatientReturnAlertFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        patientId={patientId}
        patientName={patientName}
      />
    </>
  );
}
