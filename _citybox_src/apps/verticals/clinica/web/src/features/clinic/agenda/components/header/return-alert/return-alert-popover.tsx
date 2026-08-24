"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { cn } from "@citybox/ui";
import { Button } from "@citybox/ui/atoms";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@citybox/ui/atoms";

import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";
import { useSchedulingSheet } from "@/features/clinic/agenda/contexts/scheduling-sheet-context";
import { useReturnAlerts, useDeleteReturnAlert } from "@/features/clinic/agenda/hooks/use-return-alerts";
import { buildReturnAlertSchedulingIntent } from "@/features/clinic/agenda/lib/build-return-alert-scheduling-intent";
import {
  formatReturnAlertWeekGroupLabel,
  groupReturnAlertsByWeek,
} from "@/features/clinic/agenda/lib/group-return-alerts-by-week";
import {
  formatReturnAlertPeriodLabel,
  resolveReturnAlertPeriod,
} from "@/features/clinic/agenda/lib/return-alert-period";

import { AddReturnAlertDialog } from "./add-return-alert-dialog";
import { ReturnAlertListDialog } from "./return-alert-list-dialog";
import { ReturnAlertItem } from "./return-alert-item";
import type { IReturnAlert } from "./types";
import { IconAlertCircle } from "@tabler/icons-react";

const ITEMS_PER_PAGE = 3;
const RETURN_ALERTS_PAGE_SIZE = 100;

function ReturnAlertPopover() {
  const { view, selectedDate } = useCalendar();
  const { openSheet } = useSchedulingSheet();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const period = useMemo(
    () => resolveReturnAlertPeriod(view, selectedDate),
    [view, selectedDate],
  );

  const { data } = useReturnAlerts({
    startDate: period.startDate,
    endDate: period.endDate,
    perPage: RETURN_ALERTS_PAGE_SIZE,
  });
  const { mutate: deleteAlert } = useDeleteReturnAlert();

  const alertsInPeriod = data?.alerts ?? [];
  const alertCount = data?.meta?.total ?? alertsInPeriod.length;

  const periodLabel = useMemo(() => formatReturnAlertPeriodLabel(period), [period]);

  const weeklySummary = useMemo(() => {
    if (period.periodKind !== "month" || alertsInPeriod.length === 0) {
      return [];
    }
    return groupReturnAlertsByWeek(alertsInPeriod).map(formatReturnAlertWeekGroupLabel);
  }, [alertsInPeriod, period.periodKind]);

  const alertText =
    alertCount === 0
      ? `Nenhum retorno previsto ${periodLabel}`
      : alertCount === 1
        ? `1 retorno previsto ${periodLabel}`
        : `${alertCount} retornos previstos ${periodLabel}`;

  const totalPages = Math.ceil(alertsInPeriod.length / ITEMS_PER_PAGE);
  const paginatedAlerts = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return alertsInPeriod.slice(start, start + ITEMS_PER_PAGE);
  }, [alertsInPeriod, currentPage]);

  useEffect(() => {
    setCurrentPage(0);
  }, [period.startDate, period.endDate, view]);

  const handleAddClick = () => {
    setAddDialogOpen(true);
  };

  const handleViewAllClick = () => {
    setPopoverOpen(false);
    setListDialogOpen(true);
  };

  const handleSchedule = (alert: IReturnAlert) => {
    setPopoverOpen(false);
    openSheet(buildReturnAlertSchedulingIntent({ alert }), "create");
  };

  const handleDelete = (alert: IReturnAlert) => {
    deleteAlert(alert.id);
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <IconAlertCircle className="size-5" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          collisionPadding={12}
          className="w-[calc(100vw-1.5rem)] max-w-2xl p-3 sm:w-2xl sm:p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold">Alertas de retorno</h4>
              <p className="mt-1 text-xs text-muted-foreground">{alertText}</p>
              {weeklySummary.length > 0 ? (
                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  {weeklySummary.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" onClick={handleViewAllClick}>
                Ver Todos
              </Button>
              <Button size="icon-sm" onClick={handleAddClick}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {alertsInPeriod.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">
              Nenhum alerta de retorno encontrado para os filtros aplicados.
            </p>
          ) : (
            <>
              <div className="space-y-2 mt-4">
                {paginatedAlerts.map((alert, index) => (
                  <ReturnAlertItem
                    key={`${alert.id}-${currentPage}-${index}`}
                    alert={alert}
                    onSchedule={handleSchedule}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentPage(index)}
                        className={cn(
                          "size-2 rounded-full transition-colors",
                          currentPage === index
                            ? "bg-primary"
                            : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        )}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(totalPages - 1, prev + 1)
                      )
                    }
                    disabled={currentPage === totalPages - 1}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </PopoverContent>
      </Popover>

      <AddReturnAlertDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onClose={() => setPopoverOpen(true)}
      />
      <ReturnAlertListDialog
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        onClose={() => setPopoverOpen(true)}
      />
    </>
  );
}

export { ReturnAlertPopover };
