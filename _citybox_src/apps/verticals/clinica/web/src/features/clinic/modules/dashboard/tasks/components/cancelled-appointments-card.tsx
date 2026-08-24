'use client';

import { useState } from 'react';
import { NotebookTabs } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import { DatePickerField } from '@/features/clinic/financeiro/_ui/fields';
import {
  COMMISSION_PERIOD_OPTIONS,
  type CommissionPeriodFilter,
} from '@/features/clinic/financeiro/comissoes/types/commission-financial.types';
import { ConfirmDialog } from '@citybox/ui/organisms';
import { useCancelledAppointmentTasks } from '../hooks/use-cancelled-appointment-tasks';
import type { CancelledAppointmentTask } from '../types/cancelled-appointment-task';
import { CancelledAppointmentTaskRow } from './cancelled-appointment-task-row';
import { CancelledAppointmentRescheduleDialog } from './cancelled-appointment-reschedule-dialog';

function isPeriodFilter(value: string): value is CommissionPeriodFilter {
  return COMMISSION_PERIOD_OPTIONS.some((option) => option.value === value);
}

export function CancelledAppointmentsCard() {
  const {
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    tasks,
    isLoading,
    isError,
    ignoreTask,
    resolveTask,
  } = useCancelledAppointmentTasks();

  const [taskToIgnore, setTaskToIgnore] = useState<CancelledAppointmentTask | null>(
    null,
  );
  const [taskToReschedule, setTaskToReschedule] =
    useState<CancelledAppointmentTask | null>(null);

  return (
    <>
      <Card className="gap-3 py-0">
        <CardHeader className="flex flex-col gap-3 space-y-0 px-5 pb-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-xl font-semibold">
            Consultas canceladas
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm font-normal text-muted-foreground">
              Exibindo
            </Label>
            <Select
              value={period}
              onValueChange={(value) => {
                if (isPeriodFilter(value)) setPeriod(value);
              }}
            >
              <SelectTrigger className="w-[11.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMISSION_PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {period === 'custom' ? (
              <>
                <DatePickerField
                  value={customStart}
                  onChange={setCustomStart}
                  placeholder="Início"
                />
                <DatePickerField
                  value={customEnd}
                  onChange={setCustomEnd}
                  placeholder="Fim"
                />
              </>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5 pt-0">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando…
            </p>
          ) : isError ? (
            <p className="py-10 text-center text-sm text-destructive">
              Não foi possível carregar as consultas canceladas.
            </p>
          ) : tasks.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center px-8 py-10 text-center"
              style={{ gap: 16 }}
            >
              <NotebookTabs
                className="size-36 shrink-0 text-primary"
                strokeWidth={1.25}
                aria-hidden
                style={{ display: 'block' }}
              />
              <p
                className="text-base font-semibold text-foreground"
                style={{ margin: 0, lineHeight: 1 }}
              >
                Parabéns
              </p>
              <p
                className="max-w-sm text-sm text-muted-foreground"
                style={{ margin: 0 }}
              >
                Todas as consultas canceladas estão reagendadas.
              </p>
            </div>
          ) : (
            <div>
              {tasks.map((task) => (
                <CancelledAppointmentTaskRow
                  key={task.id}
                  task={task}
                  onReschedule={setTaskToReschedule}
                  onIgnore={setTaskToIgnore}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!taskToIgnore}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setTaskToIgnore(null);
        }}
        title="Ignorar consulta"
        description="Tem certeza que você deseja ignorar o aviso dessa consulta?"
        cancelLabel="Não"
        confirmLabel="Sim"
        onConfirm={() => {
          if (taskToIgnore) {
            ignoreTask(taskToIgnore.id);
          }
          setTaskToIgnore(null);
        }}
      />

      <CancelledAppointmentRescheduleDialog
        task={taskToReschedule}
        open={!!taskToReschedule}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setTaskToReschedule(null);
        }}
        onRescheduled={resolveTask}
      />
    </>
  );
}
