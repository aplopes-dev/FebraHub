import {
  startOfWeek,
  addDays,
  format,
  parseISO,
  isSameDay,
  areIntervalsOverlapping,
  isToday,
} from "date-fns";

import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";

import { ScrollArea } from "@citybox/ui/atoms";

import { ClickableTimeSlot } from "@/features/clinic/agenda/components/clickable-time-slot";
import { EventBlock } from "@/features/clinic/agenda/components/week-and-day-view/event-block";
import { CommitmentBlock } from "@/features/clinic/agenda/components/week-and-day-view/commitment-block";
import { DroppableTimeBlock } from "@/features/clinic/agenda/components/dnd/droppable-time-block";
import { CalendarTimeline } from "@/features/clinic/agenda/components/week-and-day-view/calendar-time-line";
import { CalendarClosingGridEnd, CalendarClosingTimeLabel } from "@/features/clinic/agenda/components/week-and-day-view/calendar-closing-time-label";
import { WeekViewMultiDayEventsRow } from "@/features/clinic/agenda/components/week-and-day-view/week-view-multi-day-events-row";

import { cn } from "@citybox/ui";
import { dateLocale } from "@/features/clinic/agenda/lib/date-locale";
import {
  groupEvents,
  getEventBlockStyle,
  getVisibleHours,
  getCommitmentsForDay,
  getCommitmentBlockStyle,
  isSlotBlockedByCommitment,
  isWorkingHour,
  isWorkingTimeSlot,
  formatClosingTimeLabel,
} from "@/features/clinic/agenda/helpers";

import type { IEvent } from "@/features/clinic/agenda/interfaces";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
  commitments: IEvent[];
}

export function CalendarWeekView({ singleDayEvents, multiDayEvents, commitments }: IProps) {
  const { selectedDate, visibleHours, workingHours } = useCalendar();

  const {
    hours,
    earliestEventHour,
    fromMinutes,
    toMinutes,
    gridSpanMinutes,
    closingFooterHeightPx,
  } = getVisibleHours(visibleHours, singleDayEvents);
  const closingTimeLabel = formatClosingTimeLabel(toMinutes);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <>
      <div className="flex flex-col items-center justify-center border-b py-4 text-sm text-muted-foreground sm:hidden">
        <p>
          A visualização semanal não está disponível em dispositivos menores.
        </p>
        <p>Por favor, mude para a visualização diária ou mensal.</p>
      </div>

      <div className="hidden flex-col sm:flex">
        <div>
          <WeekViewMultiDayEventsRow
            selectedDate={selectedDate}
            multiDayEvents={multiDayEvents}
          />

          {/* Week header */}
          <div className="relative z-20 flex border-b bg-muted/20">
            <div className="w-18 shrink-0 bg-muted/40 border-r" />
            <div className="grid flex-1 grid-cols-7 divide-x border-l">
              {weekDays.map((day, index) => {
                const todayDay = isToday(day);
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center py-2.5 gap-0.5"
                  >
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      {format(day, "EEE", { locale: dateLocale })}
                    </span>
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                        todayDay
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <ScrollArea className="h-[736px]" type="always">
          <div className="flex overflow-hidden">
            {/* Hours column — cor distinta */}
            <div className="relative w-18 shrink-0 bg-muted/40 border-r">
              {hours.map((hour, index) => (
                <div key={hour} className="relative" style={{ height: "96px" }}>
                  <div className="absolute -top-3 right-3 flex h-6 items-center">
                    {index !== 0 && (
                      <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                        {String(hour).padStart(2, "0")}:00
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {hours.length > 0 ? (
                <CalendarClosingTimeLabel
                  label={closingTimeLabel}
                  footerHeightPx={closingFooterHeightPx}
                />
              ) : null}
            </div>

            {/* Week grid */}
            <div className="relative flex-1">
              <div className="grid grid-cols-7 divide-x">
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = singleDayEvents.filter(
                    (event) =>
                      isSameDay(parseISO(event.startDate), day) ||
                      isSameDay(parseISO(event.endDate), day)
                  );
                  const groupedEvents = groupEvents(dayEvents);
                  const todayColumn = isToday(day);

                  const dayCommitments = getCommitmentsForDay(commitments, day);
                  const visibleRange = {
                    from: earliestEventHour,
                    to: Math.floor(toMinutes / 60),
                    fromMinutes,
                    toMinutes,
                    gridSpanMinutes,
                  };
                  const isSlotDisabled = (hour: number, minute: number) =>
                    !isWorkingHour(day, hour, workingHours) ||
                    !isWorkingTimeSlot(hour, minute, fromMinutes, toMinutes) ||
                    isSlotBlockedByCommitment(dayCommitments, day, hour, minute);

                  return (
                    <div
                      key={dayIndex}
                      className={cn("relative", todayColumn && "bg-primary/[0.02]")}
                    >
                      {hours.map((hour, index) => {
                        return (
                          <div
                            key={hour}
                            className="relative"
                            style={{ height: "96px" }}
                          >
                            {index !== 0 && (
                              <div className="pointer-events-none absolute inset-x-0 top-0 border-b border-border/60" />
                            )}

                            <DroppableTimeBlock date={day} hour={hour} minute={0} disabled={isSlotDisabled(hour, 0)}>
                              <ClickableTimeSlot
                                date={day}
                                hour={hour}
                                minute={0}
                                disabled={isSlotDisabled(hour, 0)}
                                className="absolute inset-x-0 top-0 h-6 cursor-pointer transition-colors hover:bg-primary/5"
                              />
                            </DroppableTimeBlock>

                            <DroppableTimeBlock date={day} hour={hour} minute={15} disabled={isSlotDisabled(hour, 15)}>
                              <ClickableTimeSlot
                                date={day}
                                hour={hour}
                                minute={15}
                                disabled={isSlotDisabled(hour, 15)}
                                className="absolute inset-x-0 top-6 h-6 cursor-pointer transition-colors hover:bg-primary/5"
                              />
                            </DroppableTimeBlock>

                            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-border/40" />

                            <DroppableTimeBlock date={day} hour={hour} minute={30} disabled={isSlotDisabled(hour, 30)}>
                              <ClickableTimeSlot
                                date={day}
                                hour={hour}
                                minute={30}
                                disabled={isSlotDisabled(hour, 30)}
                                className="absolute inset-x-0 top-12 h-6 cursor-pointer transition-colors hover:bg-primary/5"
                              />
                            </DroppableTimeBlock>

                            <DroppableTimeBlock date={day} hour={hour} minute={45} disabled={isSlotDisabled(hour, 45)}>
                              <ClickableTimeSlot
                                date={day}
                                hour={hour}
                                minute={45}
                                disabled={isSlotDisabled(hour, 45)}
                                className="absolute inset-x-0 top-[72px] h-6 cursor-pointer transition-colors hover:bg-primary/5"
                              />
                            </DroppableTimeBlock>
                          </div>
                        );
                      })}

                      {hours.length > 0 ? (
                        <CalendarClosingGridEnd footerHeightPx={closingFooterHeightPx} />
                      ) : null}

                      {/* Commitment blocks */}
                      {dayCommitments.map((commitment) => {
                        const style = getCommitmentBlockStyle(commitment, day, visibleRange);
                        return (
                          <div
                            key={`commitment-${commitment.id}`}
                            className="absolute inset-x-0 z-10 px-0.5"
                            style={{ top: style.top }}
                          >
                            <CommitmentBlock event={commitment} heightPx={style.heightPx} />
                          </div>
                        );
                      })}

                      {groupedEvents.map((group, groupIndex) =>
                        group.map((event) => {
                          let style = getEventBlockStyle(
                            event,
                            day,
                            groupIndex,
                            groupedEvents.length,
                            { from: earliestEventHour, to: Math.floor(toMinutes / 60), fromMinutes, toMinutes, gridSpanMinutes }
                          );
                          const hasOverlap = groupedEvents.some(
                            (otherGroup, otherIndex) =>
                              otherIndex !== groupIndex &&
                              otherGroup.some((otherEvent) =>
                                areIntervalsOverlapping(
                                  {
                                    start: parseISO(event.startDate),
                                    end: parseISO(event.endDate),
                                  },
                                  {
                                    start: parseISO(otherEvent.startDate),
                                    end: parseISO(otherEvent.endDate),
                                  }
                                )
                              )
                          );

                          if (!hasOverlap)
                            style = { ...style, width: "100%", left: "0%" };

                          return (
                            <div
                              key={event.id}
                              className="absolute z-20 p-1"
                              style={style}
                            >
                              <EventBlock event={event} />
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>

              <CalendarTimeline fromMinutes={fromMinutes} toMinutes={toMinutes} />
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
