import { parseISO, areIntervalsOverlapping, format, isToday } from "date-fns";

import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";

import { ScrollArea } from "@citybox/ui/atoms";

import { ClickableTimeSlot } from "@/features/clinic/agenda/components/clickable-time-slot";
import { EventBlock } from "@/features/clinic/agenda/components/week-and-day-view/event-block";
import { CommitmentBlock } from "@/features/clinic/agenda/components/week-and-day-view/commitment-block";
import { DroppableTimeBlock } from "@/features/clinic/agenda/components/dnd/droppable-time-block";
import { CalendarTimeline } from "@/features/clinic/agenda/components/week-and-day-view/calendar-time-line";
import { CalendarClosingGridEnd, CalendarClosingTimeLabel } from "@/features/clinic/agenda/components/week-and-day-view/calendar-closing-time-label";
import { DayViewMultiDayEventsRow } from "@/features/clinic/agenda/components/week-and-day-view/day-view-multi-day-events-row";

import { cn } from "@citybox/ui";
import { dateLocale } from "@/features/clinic/agenda/lib/date-locale";
import {
  groupEvents,
  getEventBlockStyle,
  isWorkingHour,
  getVisibleHours,
  getCommitmentsForDay,
  getCommitmentBlockStyle,
  isSlotBlockedByCommitment,
  isWorkingTimeSlot,
  formatClosingTimeLabel,
} from "@/features/clinic/agenda/helpers";

import type { IEvent } from "@/features/clinic/agenda/interfaces";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
  commitments: IEvent[];
}

export function CalendarDayView({ singleDayEvents, multiDayEvents, commitments }: IProps) {
  const { selectedDate, visibleHours, workingHours } = useCalendar();

  if (
    !selectedDate ||
    !(selectedDate instanceof Date) ||
    isNaN(selectedDate.getTime())
  ) {
    return null;
  }

  const {
    hours,
    earliestEventHour,
    fromMinutes,
    toMinutes,
    gridSpanMinutes,
    closingFooterHeightPx,
  } = getVisibleHours(visibleHours, singleDayEvents);

  const dayEvents = singleDayEvents.filter((event) => {
    const eventDate = parseISO(event.startDate);
    return (
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const groupedEvents = groupEvents(dayEvents);
  const todayDate = isToday(selectedDate);

  const dayCommitments = getCommitmentsForDay(commitments, selectedDate);

  const visibleRange = {
    from: earliestEventHour,
    to: Math.floor(toMinutes / 60),
    fromMinutes,
    toMinutes,
    gridSpanMinutes,
  };
  const closingTimeLabel = formatClosingTimeLabel(toMinutes);

  const isSlotDisabled = (hour: number, minute: number) =>
    !isWorkingHour(selectedDate, hour, workingHours) ||
    !isWorkingTimeSlot(hour, minute, fromMinutes, toMinutes) ||
    isSlotBlockedByCommitment(dayCommitments, selectedDate, hour, minute);

  return (
    <div className="flex">
      <div className="flex flex-1 flex-col">
        <div>
          <DayViewMultiDayEventsRow
            selectedDate={selectedDate}
            multiDayEvents={multiDayEvents}
          />

          {/* Day header */}
          <div className="relative z-20 flex border-b bg-muted/20">
            <div className="w-18 shrink-0 bg-muted/40 border-r" />
            <div className="flex flex-1 items-center justify-center gap-2 py-2.5 border-l">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {format(selectedDate, "EEE", { locale: dateLocale })}
              </span>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                  todayDate
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground"
                )}
              >
                {format(selectedDate, "d")}
              </span>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[800px]" type="always">
          <div className="flex">
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

            {/* Day grid */}
            <div className="relative flex-1">
              <div className="relative">
                {hours.map((hour, index) => {
                  const isDisabled = !isWorkingHour(
                    selectedDate,
                    hour,
                    workingHours
                  );

                  return (
                    <div
                      key={hour}
                      className={cn(
                        "relative",
                        isDisabled ? "bg-muted/30" : "bg-background"
                      )}
                      style={{ height: "96px" }}
                    >
                      {index !== 0 && (
                        <div className="pointer-events-none absolute inset-x-0 top-0 border-b border-border/60" />
                      )}

                      <DroppableTimeBlock date={selectedDate} hour={hour} minute={0} disabled={isSlotDisabled(hour, 0)}>
                        <ClickableTimeSlot
                          date={selectedDate}
                          hour={hour}
                          minute={0}
                          disabled={isSlotDisabled(hour, 0)}
                          className="absolute inset-x-0 top-0 h-6 cursor-pointer transition-colors hover:bg-primary/5"
                        />
                      </DroppableTimeBlock>

                      <DroppableTimeBlock date={selectedDate} hour={hour} minute={15} disabled={isSlotDisabled(hour, 15)}>
                        <ClickableTimeSlot
                          date={selectedDate}
                          hour={hour}
                          minute={15}
                          disabled={isSlotDisabled(hour, 15)}
                          className="absolute inset-x-0 top-6 h-6 cursor-pointer transition-colors hover:bg-primary/5"
                        />
                      </DroppableTimeBlock>

                      <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-border/40" />

                      <DroppableTimeBlock date={selectedDate} hour={hour} minute={30} disabled={isSlotDisabled(hour, 30)}>
                        <ClickableTimeSlot
                          date={selectedDate}
                          hour={hour}
                          minute={30}
                          disabled={isSlotDisabled(hour, 30)}
                          className="absolute inset-x-0 top-12 h-6 cursor-pointer transition-colors hover:bg-primary/5"
                        />
                      </DroppableTimeBlock>

                      <DroppableTimeBlock date={selectedDate} hour={hour} minute={45} disabled={isSlotDisabled(hour, 45)}>
                        <ClickableTimeSlot
                          date={selectedDate}
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

                {/* Commitment blocks — renderizados antes dos eventos */}
                {dayCommitments.map((commitment) => {
                  const style = getCommitmentBlockStyle(
                    commitment,
                    selectedDate,
                    visibleRange
                  );
                  return (
                    <div
                      key={`commitment-${commitment.id}`}
                      className="absolute inset-x-0 z-10 px-1"
                      style={{ top: style.top }}
                    >
                      <CommitmentBlock event={commitment} heightPx={style.heightPx} />
                    </div>
                  );
                })}

                {/* Appointment event blocks */}
                {groupedEvents.map((group, groupIndex) =>
                  group.map((event) => {
                    let style = getEventBlockStyle(
                      event,
                      selectedDate,
                      groupIndex,
                      groupedEvents.length,
                      { from: earliestEventHour, to: Math.floor(toMinutes / 60), fromMinutes, toMinutes, gridSpanMinutes }
                    );
                    const hasOverlap = groupedEvents.some(
                      (otherGroup, otherIndex) =>
                        otherIndex !== groupIndex &&
                        otherGroup.some((otherEvent) =>
                          areIntervalsOverlapping(
                            { start: parseISO(event.startDate), end: parseISO(event.endDate) },
                            { start: parseISO(otherEvent.startDate), end: parseISO(otherEvent.endDate) }
                          )
                        )
                    );

                    if (!hasOverlap)
                      style = { ...style, width: "100%", left: "0%" };

                    return (
                      <div key={event.id} className="absolute z-20 p-1" style={style}>
                        <EventBlock event={event} />
                      </div>
                    );
                  })
                )}
              </div>

              <CalendarTimeline fromMinutes={fromMinutes} toMinutes={toMinutes} />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
