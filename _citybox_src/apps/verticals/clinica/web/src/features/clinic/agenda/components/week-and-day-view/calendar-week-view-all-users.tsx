"use client";

import { addDays, endOfDay, format, isSameDay, isToday, parseISO, startOfDay, startOfWeek } from "date-fns";
import { Lock, Plus } from "lucide-react";

import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";
import { useSchedulingSheet } from "@/features/clinic/agenda/contexts/scheduling-sheet-context";
import { useSchedulePermissions } from "@/features/clinic/agenda/hooks/use-schedule-permissions";

import { Avatar, AvatarFallback, AvatarImage } from "@citybox/ui/atoms";
import { ScrollArea } from "@citybox/ui/atoms";

import { EventDetailsPopover } from "@/features/clinic/agenda/components/event-details-popover";

import { cn } from "@citybox/ui";
import { dateLocale } from "@/features/clinic/agenda/lib/date-locale";
import { getCommitmentsForDay } from "@/features/clinic/agenda/helpers";

import type { IEvent } from "@/features/clinic/agenda/interfaces";
import type { TEventColor } from "@/features/clinic/agenda/types";

const COLOR_BORDER: Partial<Record<TEventColor, string>> = {
  blue: "border-l-blue-500 bg-blue-50/80 dark:bg-blue-950/40",
  green: "border-l-green-500 bg-green-50/80 dark:bg-green-950/40",
  red: "border-l-red-500 bg-red-50/80 dark:bg-red-950/40",
  yellow: "border-l-yellow-500 bg-yellow-50/80 dark:bg-yellow-950/40",
  purple: "border-l-purple-500 bg-purple-50/80 dark:bg-purple-950/40",
  orange: "border-l-orange-500 bg-orange-50/80 dark:bg-orange-950/40",
  gray: "border-l-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/40",
};

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
  commitments: IEvent[];
}

export function CalendarWeekViewAllUsers({ singleDayEvents, multiDayEvents, commitments }: IProps) {
  const { selectedDate, users } = useCalendar();
  const { openSheet } = useSchedulingSheet();
  const { canCreateScheduling } = useSchedulePermissions();

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <>
      {/* Aviso mobile */}
      <div className="flex flex-col items-center justify-center border-b py-4 text-sm text-muted-foreground sm:hidden">
        <p>A visualização semanal não está disponível em dispositivos menores.</p>
        <p>Por favor, mude para a visualização diária ou mensal.</p>
      </div>

      <div className="hidden sm:flex flex-col">
        {/* Cabeçalho dos dias */}
        <div className="sticky top-0 z-20 flex border-b bg-background/95 backdrop-blur-sm">
          <div className="w-44 shrink-0 border-r bg-muted/40" />
          <div className="grid flex-1 grid-cols-7 divide-x border-l">
            {weekDays.map((day, i) => {
              const todayDay = isToday(day);
              return (
                <div key={i} className={cn("flex flex-col items-center gap-0.5 py-2.5", todayDay && "bg-primary/[0.03]")}>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {format(day, "EEE", { locale: dateLocale })}
                  </span>
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                      todayDay ? "bg-primary text-primary-foreground" : "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Linhas por profissional */}
        <ScrollArea className="h-[736px]" type="always">
          <div className="flex flex-col divide-y" style={{ minHeight: "736px" }}>
            {(() => {
              const CONTAINER_H = 736;
              const MIN_ROW_H = 130;
              const rowHeight = Math.max(CONTAINER_H / (users.length || 1), MIN_ROW_H);
              return users.map((user) => (
              <div key={user.id} className="flex" style={{ height: `${rowHeight}px` }}>
                {/* Label do profissional */}
                <div className="w-44 shrink-0 border-r bg-muted/20 flex items-start gap-2.5 p-3 sticky left-0">
                  <Avatar className="size-8 shrink-0 mt-0.5">
                    <AvatarImage src={user.picturePath ?? undefined} alt={user.name} />
                    <AvatarFallback className="text-xs font-semibold">{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-medium text-foreground leading-snug break-words pt-0.5">
                    {user.name}
                  </p>
                </div>

                {/* Células por dia */}
                <div className="grid flex-1 grid-cols-7 divide-x border-l">
                  {weekDays.map((day) => {
                    const dayStart = startOfDay(day);
                    const dayEnd = endOfDay(day);

                    const dayEvents = [
                      ...singleDayEvents.filter(
                        (e) => e.user.id === user.id && isSameDay(parseISO(e.startDate), day)
                      ),
                      ...multiDayEvents.filter(
                        (e) =>
                          e.user.id === user.id &&
                          parseISO(e.startDate) <= dayEnd &&
                          parseISO(e.endDate) >= dayStart
                      ),
                    ].sort((a, b) => a.startDate.localeCompare(b.startDate));

                    const dayCommitments = getCommitmentsForDay(
                      commitments.filter((c) => c.user.id === user.id),
                      day
                    );

                    const hasAllDayBlock = dayCommitments.some(
                      (c) => c.rawCommitment?.allDay && c.rawCommitment?.availability !== "available"
                    );

                    const hasAnyCommitment = dayCommitments.length > 0;

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "group relative flex flex-col gap-1 p-1.5",
                          hasAllDayBlock && "bg-muted/30",
                          isToday(day) && !hasAllDayBlock && "bg-primary/[0.02]"
                        )}
                        style={
                          hasAllDayBlock
                            ? {
                                backgroundImage:
                                  "repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(0,0,0,0.02) 8px, rgba(0,0,0,0.02) 16px)",
                              }
                            : undefined
                        }
                      >
                        {/* Compromissos */}
                        {dayCommitments.map((c) => {
                          const isBusy = c.rawCommitment?.availability !== "available";
                          const isAllDay = c.rawCommitment?.allDay;
                          return (
                            <EventDetailsPopover key={`c-${c.id}`} event={c}>
                              <div
                                role="button"
                                tabIndex={0}
                                className={cn(
                                  "flex flex-col gap-0.5 rounded border border-dashed px-1.5 py-1 text-[10px] select-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                  isBusy
                                    ? "border-muted-foreground/40 text-muted-foreground bg-muted/40"
                                    : "border-green-400/50 text-green-700 bg-green-50/50 dark:text-green-400 dark:bg-green-950/30"
                                )}
                              >
                                <div className="flex items-center gap-1">
                                  <Lock className="size-2.5 shrink-0" />
                                  <span className="truncate font-medium">{c.title}</span>
                                </div>
                                <span className="opacity-60 tabular-nums">
                                  {isAllDay
                                    ? "Dia todo"
                                    : `${format(parseISO(c.startDate), "HH:mm")} – ${format(parseISO(c.endDate), "HH:mm")}`}
                                </span>
                              </div>
                            </EventDetailsPopover>
                          );
                        })}

                        {/* Consultas / atendimentos */}
                        {dayEvents.map((event) => {
                          const colorClass =
                            COLOR_BORDER[event.color] ??
                            "border-l-blue-500 bg-blue-50/80 dark:bg-blue-950/40";
                          const isMultiDay = !isSameDay(
                            parseISO(event.startDate),
                            parseISO(event.endDate)
                          );

                          return (
                            <EventDetailsPopover key={event.id} event={event}>
                              <div
                                role="button"
                                tabIndex={0}
                                className={cn(
                                  "flex flex-col gap-0.5 rounded-r border-l-2 px-1.5 py-1 text-[10px] select-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                  colorClass
                                )}
                              >
                                <span className="font-semibold truncate leading-tight">
                                  {event.title}
                                </span>
                                <span className="opacity-60 tabular-nums">
                                  {isMultiDay
                                    ? `${format(parseISO(event.startDate), "HH:mm")} · multi-dia`
                                    : `${format(parseISO(event.startDate), "HH:mm")} – ${format(parseISO(event.endDate), "HH:mm")}`}
                                </span>
                              </div>
                            </EventDetailsPopover>
                          );
                        })}

                        {/* Botão de adicionar — oculto se houver qualquer compromisso */}
                        {!hasAnyCommitment && canCreateScheduling && (
                          <button
                            className="flex items-center justify-center gap-1 rounded border border-dashed border-border/0 py-1 text-[10px] text-muted-foreground transition-all opacity-0 group-hover:opacity-100 hover:border-border/60 hover:bg-muted/40"
                            onClick={() =>
                              openSheet({ date: formatLocalDate(day), startTime: "09:00" })
                            }
                          >
                            <Plus className="size-3" />
                            <span>Adicionar</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
            })()}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
