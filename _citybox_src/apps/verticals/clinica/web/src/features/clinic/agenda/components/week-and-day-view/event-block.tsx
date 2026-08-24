import { cva } from "class-variance-authority";

import {
  formatClinicTimeFromIso,
  parseClinicDateTimeIso,
} from "@/features/clinic/agenda/lib/clinic-datetime";

import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";

import { DraggableEvent } from "@/features/clinic/agenda/components/dnd/draggable-event";
import { EventDetailsPopover } from "@/features/clinic/agenda/components/event-details-popover";
import { resolveCalendarEventColor } from "@/features/clinic/agenda/utils/calendar-transform";

import { cn } from "@citybox/ui";

import type { HTMLAttributes } from "react";
import type { IEvent } from "@/features/clinic/agenda/interfaces";
import type { VariantProps } from "class-variance-authority";

const calendarWeekEventCardVariants = cva(
  "flex select-none flex-col gap-0.5 truncate whitespace-nowrap rounded-md border px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  {
    variants: {
      color: {
        // Colored and mixed variants
        blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 [&_.event-dot]:fill-blue-600",
        green:
          "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300 [&_.event-dot]:fill-green-600",
        red: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300 [&_.event-dot]:fill-red-600",
        yellow:
          "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 [&_.event-dot]:fill-yellow-600",
        purple:
          "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300 [&_.event-dot]:fill-purple-600",
        orange:
          "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300 [&_.event-dot]:fill-orange-600",
        gray: "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 [&_.event-dot]:fill-neutral-600",

        // Dot variants
        "blue-dot":
          "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-blue-600",
        "green-dot":
          "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-green-600",
        "red-dot":
          "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-red-600",
        "orange-dot":
          "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-orange-600",
        "purple-dot":
          "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-purple-600",
        "yellow-dot":
          "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-yellow-600",
        "gray-dot":
          "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-neutral-600",
      },
    },
    defaultVariants: {
      color: "blue-dot",
    },
  }
);

interface IProps
  extends
    HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof calendarWeekEventCardVariants>, "color"> {
  event: IEvent;
}

export function EventBlock({ event, className }: IProps) {
  const { badgeVariant, visibleHours } = useCalendar();

  const start = parseClinicDateTimeIso(event.startDate);
  const end = parseClinicDateTimeIso(event.endDate);

  const fromMinutes = visibleHours.fromMinutes ?? visibleHours.from * 60;
  const toMinutes = visibleHours.toMinutes ?? visibleHours.to * 60;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const clampedEndMinutes = Math.min(endMinutes, toMinutes);
  const clampedStartMinutes = Math.max(startMinutes, fromMinutes);
  const durationInMinutes = Math.max(clampedEndMinutes - clampedStartMinutes, 0);
  const heightInPixels = (durationInMinutes / 60) * 96 - 8;

  const color = resolveCalendarEventColor(
    event,
    badgeVariant,
  ) as VariantProps<typeof calendarWeekEventCardVariants>["color"];

  const calendarWeekEventCardClasses = cn(
    calendarWeekEventCardVariants({ color, className }),
    durationInMinutes < 35 && "py-0 justify-center"
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.currentTarget instanceof HTMLElement) e.currentTarget.click();
    }
  };

  return (
    <DraggableEvent event={event}>
      <EventDetailsPopover event={event}>
        <div
          role="button"
          tabIndex={0}
          className={calendarWeekEventCardClasses}
          style={{ height: `${heightInPixels}px` }}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center gap-1.5 truncate">
            {["mixed", "dot"].includes(badgeVariant) && (
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                className="event-dot shrink-0"
              >
                <circle cx="4" cy="4" r="4" />
              </svg>
            )}

            <p className="truncate font-semibold">{event.title}</p>
          </div>

          {durationInMinutes > 25 && (
            <p>
              {formatClinicTimeFromIso(event.startDate)} - {formatClinicTimeFromIso(event.endDate)}
            </p>
          )}
        </div>
      </EventDetailsPopover>
    </DraggableEvent>
  );
}
