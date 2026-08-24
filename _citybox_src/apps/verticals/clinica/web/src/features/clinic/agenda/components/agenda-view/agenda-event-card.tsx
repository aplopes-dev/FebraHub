"use client";

import { format, parseISO } from "date-fns";
import { cva } from "class-variance-authority";
import { Clock, User } from "lucide-react";

import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";

import { EventDetailsPopover } from "@/features/clinic/agenda/components/event-details-popover";

import { dateLocale } from "@/features/clinic/agenda/lib/date-locale";
import { resolveCalendarEventColor } from "@/features/clinic/agenda/utils/calendar-transform";

import type { IEvent } from "@/features/clinic/agenda/interfaces";
import type { VariantProps } from "class-variance-authority";

const agendaEventCardVariants = cva(
  "flex select-none items-center justify-between gap-3 rounded-md border p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  {
    variants: {
      color: {
        // Colored variants
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
        gray: "border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 [&_.event-dot]:fill-neutral-600",

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

interface IProps {
  event: IEvent;
  eventCurrentDay?: number;
  eventTotalDays?: number;
}

export function AgendaEventCard({
  event,
  eventCurrentDay,
  eventTotalDays,
}: IProps) {
  const { badgeVariant } = useCalendar();

  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);

  const color = resolveCalendarEventColor(
    event,
    badgeVariant,
  ) as VariantProps<typeof agendaEventCardVariants>["color"];

  const agendaEventCardClasses = agendaEventCardVariants({ color });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.currentTarget instanceof HTMLElement) e.currentTarget.click();
    }
  };

  return (
    <EventDetailsPopover event={event}>
      <div
        role="button"
        tabIndex={0}
        className={agendaEventCardClasses}
        onKeyDown={handleKeyDown}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
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

            <p className="font-medium">
              {eventCurrentDay && eventTotalDays && (
                <span className="mr-1 text-xs">
                  Dia {eventCurrentDay} de {eventTotalDays} •{" "}
                </span>
              )}
              {event.title}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <User className="size-3 shrink-0 opacity-60" />
            <p className="text-xs">{event.user.name}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="size-3 shrink-0 opacity-60" />
            <p className="text-xs">
              {format(startDate, "HH:mm", { locale: dateLocale })} –{" "}
              {format(endDate, "HH:mm", { locale: dateLocale })}
            </p>
          </div>

        </div>
      </div>
    </EventDetailsPopover>
  );
}
