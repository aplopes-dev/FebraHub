import { useMemo } from "react";

import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";

import { DayCell } from "@/features/clinic/agenda/components/month-view/day-cell";

import {
  getCalendarCells,
  calculateMonthEventPositions,
} from "@/features/clinic/agenda/helpers";
import { WEEKDAYS_SHORT } from "@/features/clinic/agenda/lib/date-locale";

import type { IEvent } from "@/features/clinic/agenda/interfaces";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
}

export function CalendarMonthView({ singleDayEvents, multiDayEvents }: IProps) {
  const { selectedDate } = useCalendar();

  const allEvents = [...multiDayEvents, ...singleDayEvents];

  const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);

  const eventPositions = useMemo(
    () =>
      calculateMonthEventPositions(
        multiDayEvents,
        singleDayEvents,
        selectedDate
      ),
    [multiDayEvents, singleDayEvents, selectedDate]
  );

  return (
    <div>
      <div className="grid grid-cols-7 divide-x border-b bg-muted/40">
        {WEEKDAYS_SHORT.map((day) => (
          <div key={day} className="flex items-center justify-center py-2.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {day}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 overflow-hidden">
        {cells.map((cell) => (
          <DayCell
            key={cell.date.toISOString()}
            cell={cell}
            events={allEvents}
            eventPositions={eventPositions}
          />
        ))}
      </div>
    </div>
  );
}
