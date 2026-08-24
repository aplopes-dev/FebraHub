import { isToday } from "date-fns";

import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";

import { cn } from "@citybox/ui";

import type { IEvent } from "@/features/clinic/agenda/interfaces";

interface IProps {
  day: number;
  date: Date;
  events: IEvent[];
}

export function YearViewDayCell({ day, date, events }: IProps) {
  const { setSelectedDate, setView } = useCalendar();

  const maxIndicators = 3;
  const eventCount = events.length;

  const handleClick = () => {
    setSelectedDate(date);
    setView("day");
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className="flex h-8 flex-1 flex-col items-center justify-center gap-0.5 rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
    >
      <div
        className={cn(
          "flex size-5 items-center justify-center rounded-full text-[11px] font-medium",
          isToday(date) && "bg-primary font-semibold text-primary-foreground"
        )}
      >
        {day}
      </div>

      {eventCount > 0 && (
        <div className="mt-0.5 flex gap-0.5">
          {eventCount <= maxIndicators ? (
            events.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "size-1.5 rounded-full",
                  event.color === "blue" && "bg-blue-600",
                  event.color === "green" && "bg-green-600",
                  event.color === "red" && "bg-red-600",
                  event.color === "yellow" && "bg-yellow-600",
                  event.color === "purple" && "bg-purple-600",
                  event.color === "orange" && "bg-orange-600",
                  event.color === "gray" && "bg-neutral-600"
                )}
              />
            ))
          ) : (
            <>
              <div
                className={cn(
                  "size-1.5 rounded-full",
                  events[0].color === "blue" && "bg-blue-600",
                  events[0].color === "green" && "bg-green-600",
                  events[0].color === "red" && "bg-red-600",
                  events[0].color === "yellow" && "bg-yellow-600",
                  events[0].color === "purple" && "bg-purple-600",
                  events[0].color === "orange" && "bg-orange-600"
                )}
              />
              <span className="text-[7px] text-muted-foreground">
                +{eventCount - 1}
              </span>
            </>
          )}
        </div>
      )}
    </button>
  );
}
