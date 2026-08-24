'use client';

import { useState, useEffect } from "react";
import { addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

import { Button } from "@citybox/ui/atoms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@citybox/ui/atoms";
import { ScrollArea } from "@citybox/ui/atoms";
import { Skeleton } from "@citybox/ui/atoms";
import { Label } from "@citybox/ui/atoms";
import { DatePicker } from "@citybox/ui/molecules";
import { cn } from "@citybox/ui";
import { useAvailableSlots } from "../../hooks/use-available-slots";
import type { TimeSlotItem } from "@/features/clinic/agenda/api/types";

type FindFreeSlotDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  durationMinutes: number;
  professionalId: string | undefined;
  onSelectSlot: (date: Date, startTime: string) => void;
};

/** Horários com início antes destas horas vão para "Manhã"; a partir da tarde, "Tarde". */
const MORNING_END_HOUR = 12;
const AFTERNOON_START_HOUR = 14;

function slotStartHour(startTime: string): number {
  return parseInt(startTime.split(":")[0] ?? "0", 10);
}

function formatSlotLabel(startTime: string, endTime: string): string {
  const start = startTime.slice(0, 5);
  const end = endTime.slice(0, 5);
  return `${start}–${end}`;
}

function SlotsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-1.5 p-2 sm:grid-cols-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full rounded-md" />
      ))}
    </div>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function FindFreeSlotDialog({
  open,
  onOpenChange,
  durationMinutes,
  professionalId,
  onSelectSlot,
}: FindFreeSlotDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotItem | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedDate(new Date());
      setSelectedSlot(null);
    }
  }, [open]);

  const { data, isLoading, isError, refetch } = useAvailableSlots({
    professionalId,
    date: selectedDate,
    durationMin: durationMinutes,
  });

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const availableSlots = data?.slots.filter((s) => s.available) ?? [];

  // Removemos slots que ficariam no "intervalo de almoço" (>= 12:00 e < 14:00).
  const morningSlots = availableSlots.filter(
    (s) => slotStartHour(s.startTime) < MORNING_END_HOUR,
  );
  const afternoonSlots = availableSlots.filter(
    (s) => slotStartHour(s.startTime) >= AFTERNOON_START_HOUR,
  );

  const handleConfirm = () => {
    if (selectedDate && selectedSlot) {
      onSelectSlot(selectedDate, selectedSlot.startTime);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const renderSlotColumn = (slots: TimeSlotItem[], label: string) => (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border">
      <h4 className="shrink-0 bg-muted px-3 py-2 text-sm font-medium">{label}</h4>
      <ScrollArea className="min-h-0 flex-1">
        {isLoading ? (
          <SlotsSkeleton />
        ) : isError ? (
          <EmptyMessage>
            Erro ao carregar horários.{" "}
            <button
              type="button"
              className="ml-1 underline"
              onClick={() => refetch()}
            >
              Tentar novamente
            </button>
          </EmptyMessage>
        ) : !professionalId ? (
          <EmptyMessage>
            Selecione um profissional para ver os horários disponíveis
          </EmptyMessage>
        ) : data?.workingWindow === null ? (
          <EmptyMessage>O profissional não atende neste dia</EmptyMessage>
        ) : slots.length === 0 ? (
          <EmptyMessage>Sem horários disponíveis</EmptyMessage>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 p-2">
            {slots.map((slot) => {
              const isSelected = selectedSlot?.startTime === slot.startTime;
              return (
                <Button
                  key={slot.startTime}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className="h-auto min-h-9 w-full min-w-0 justify-center px-2 py-2 text-xs font-medium tabular-nums whitespace-nowrap sm:text-sm"
                  onClick={() => setSelectedSlot(slot)}
                >
                  <span className="truncate">
                    {formatSlotLabel(slot.startTime, slot.endTime)}
                  </span>
                </Button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "flex max-h-[min(90dvh,40rem)] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 overflow-hidden p-4",
          "sm:h-[600px] sm:max-h-[90dvh] sm:max-w-3xl sm:p-6",
        )}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="size-5 shrink-0" />
            Buscar Horário Livre
          </DialogTitle>
        </DialogHeader>

        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden sm:mt-2 sm:gap-4">
          <div className="mx-auto flex w-full max-w-md shrink-0 items-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() =>
                selectedDate && handleDateChange(subDays(selectedDate, 1))
              }
              disabled={!selectedDate}
            >
              <ChevronLeft className="size-4" />
            </Button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1.5">
                <Label>Selecione a Data</Label>
                <DatePicker value={selectedDate} onChange={handleDateChange} />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() =>
                selectedDate && handleDateChange(addDays(selectedDate, 1))
              }
              disabled={!selectedDate}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {selectedDate ? (
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6">
              {renderSlotColumn(morningSlots, "Manhã")}
              {renderSlotColumn(afternoonSlots, "Tarde")}
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 flex-col-reverse gap-2 pt-4 sm:flex-row sm:gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            disabled={!selectedDate || !selectedSlot}
            onClick={handleConfirm}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { FindFreeSlotDialog };
