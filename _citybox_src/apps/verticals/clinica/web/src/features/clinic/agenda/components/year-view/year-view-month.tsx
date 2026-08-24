import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  isSameDay,
  parseISO,
  getDaysInMonth,
  startOfMonth,
} from "date-fns";

import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";

import { YearViewDayCell } from "@/features/clinic/agenda/components/year-view/year-view-day-cell";

import { dateLocale, WEEKDAYS_SHORT } from "@/features/clinic/agenda/lib/date-locale";

import type { IEvent } from "@/features/clinic/agenda/interfaces";

interface IProps {
  month: Date;
  events: IEvent[];
}

export function YearViewMonth({ month, events }: IProps) {
  const { push } = useRouter();
  const { setSelectedDate } = useCalendar();

  const monthName = format(month, "MMMM", { locale: dateLocale });

  const daysInMonth = useMemo(() => {
    const totalDays = getDaysInMonth(month);
    const firstDay = startOfMonth(month).getDay();

    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const blanks = Array(firstDay).fill(null);

    return [...blanks, ...days];
  }, [month]);

  const handleClick = () => {
    setSelectedDate(new Date(month.getFullYear(), month.getMonth(), 1));
    push("/month-view");
  };

  return (
    <div className="flex flex-col rounded-xl border overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={handleClick}
        className="w-full bg-muted/40 px-3 py-2.5 text-sm font-semibold capitalize hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors border-b text-left"
      >
        {monthName}
      </button>

      <div className="flex-1 space-y-1.5 p-2.5 bg-background">
        <div className="grid grid-cols-7 text-center">
          {WEEKDAYS_SHORT.map((day, index) => (
            <div
              key={index}
              className="text-[10px] font-semibold text-muted-foreground uppercase py-0.5"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-0.5">
          {daysInMonth.map((day, index) => {
            if (day === null)
              return <div key={`blank-${index}`} className="h-8" />;

            const date = new Date(month.getFullYear(), month.getMonth(), day);
            const dayEvents = events.filter(
              (event) =>
                isSameDay(parseISO(event.startDate), date) ||
                isSameDay(parseISO(event.endDate), date)
            );

            return (
              <YearViewDayCell
                key={`day-${day}`}
                day={day}
                date={date}
                events={dayEvents}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
