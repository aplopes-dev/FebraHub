"use client";

import { useState } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  addDays,
} from "date-fns";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollArea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { DatePicker } from "@citybox/ui/molecules";
import { useReturnAlerts, useDeleteReturnAlert } from "@/features/clinic/agenda/hooks/use-return-alerts";
import { buildReturnAlertSchedulingIntent } from "@/features/clinic/agenda/lib/build-return-alert-scheduling-intent";
import { useSchedulingSheet } from "@/features/clinic/agenda/contexts/scheduling-sheet-context";

import { AddReturnAlertDialog } from "./add-return-alert-dialog";
import { ReturnAlertItem } from "./return-alert-item";
import type { IReturnAlert } from "./types";

type TFilterPeriod =
  | "all"
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "last_30_days"
  | "next_30_days"
  | "custom";

const FILTER_PERIOD_OPTIONS = [
  { value: "all", label: "todo período" },
  { value: "today", label: "de hoje" },
  { value: "this_week", label: "dessa semana" },
  { value: "this_month", label: "desse mês" },
  { value: "last_month", label: "do mês passado" },
  { value: "last_30_days", label: "dos últimos 30 dias" },
  { value: "next_30_days", label: "dos próximos 30 dias" },
  { value: "custom", label: "escolher período" },
];

function resolvePeriodDates(
  period: TFilterPeriod,
  customStart?: Date,
  customEnd?: Date,
): { startDate?: string; endDate?: string } {
  const today = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  switch (period) {
    case "all":
      return {};
    case "today":
      return { startDate: fmt(today), endDate: fmt(today) };
    case "this_week":
      return {
        startDate: fmt(startOfWeek(today, { weekStartsOn: 0 })),
        endDate: fmt(endOfWeek(today, { weekStartsOn: 0 })),
      };
    case "this_month":
      return {
        startDate: fmt(startOfMonth(today)),
        endDate: fmt(endOfMonth(today)),
      };
    case "last_month": {
      const lastMonth = subMonths(today, 1);
      return {
        startDate: fmt(startOfMonth(lastMonth)),
        endDate: fmt(endOfMonth(lastMonth)),
      };
    }
    case "last_30_days":
      return { startDate: fmt(subDays(today, 30)), endDate: fmt(today) };
    case "next_30_days":
      return { startDate: fmt(today), endDate: fmt(addDays(today, 30)) };
    case "custom":
      return {
        startDate: customStart ? fmt(customStart) : undefined,
        endDate: customEnd ? fmt(customEnd) : undefined,
      };
  }
}

type ReturnAlertListDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
};

function ReturnAlertListDialog({
  open,
  onOpenChange,
  onClose,
}: ReturnAlertListDialogProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<TFilterPeriod>("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const { openSheet } = useSchedulingSheet();
  const { mutate: deleteAlert } = useDeleteReturnAlert();

  const showCustomDates = filterPeriod === "custom";

  const { startDate: resolvedStart, endDate: resolvedEnd } = resolvePeriodDates(
    filterPeriod,
    startDate,
    endDate,
  );

  const { data, isLoading } = useReturnAlerts({
    startDate: resolvedStart,
    endDate: resolvedEnd,
  });
  const alerts = data?.alerts ?? [];

  const handleSchedule = (alert: IReturnAlert) => {
    onOpenChange(false);
    openSheet(buildReturnAlertSchedulingIntent({ alert }), "create");
  };

  const handleDelete = (alert: IReturnAlert) => {
    deleteAlert(alert.id);
  };

  const customHeader = (
    <div className="flex items-center justify-between gap-4">
      <DialogTitle>Todos os Alertas de Retorno</DialogTitle>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground shrink-0">Exibindo</span>
        <div className="flex flex-col gap-1.5 w-44">
          <Select
            value={filterPeriod}
            onValueChange={(value: string) =>
              setFilterPeriod(value as TFilterPeriod)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {showCustomDates && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>Data Inicial</Label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                className="w-36"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Data Final</Label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                className="w-36"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[600px] flex-col gap-0 p-0 sm:max-w-4xl"
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            {customHeader}
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 px-6 py-3">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">
                  Carregando alertas...
                </p>
              ) : alerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum alerta de retorno cadastrado.
                </p>
              ) : (
                alerts.map((alert) => (
                  <ReturnAlertItem
                    key={alert.id}
                    alert={alert}
                    onSchedule={handleSchedule}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="shrink-0 border-t px-6 py-3">
            <Button
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                onClose?.();
              }}
            >
              Fechar
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddReturnAlertDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </>
  );
}

export { ReturnAlertListDialog };
