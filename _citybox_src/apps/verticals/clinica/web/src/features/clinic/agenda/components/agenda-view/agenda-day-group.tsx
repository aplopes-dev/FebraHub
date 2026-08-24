import { differenceInDays, format, isToday, parseISO, startOfDay } from "date-fns";
import { Lock } from "lucide-react";

import { AgendaEventCard } from "@/features/clinic/agenda/components/agenda-view/agenda-event-card";
import { EventDetailsPopover } from "@/features/clinic/agenda/components/event-details-popover";

import { cn } from "@citybox/ui";
import { dateLocale } from "@/features/clinic/agenda/lib/date-locale";

import type { IEvent } from "@/features/clinic/agenda/interfaces";

interface IProps {
  date: Date;
  events: IEvent[];
  multiDayEvents: IEvent[];
  commitments: IEvent[];
}

export function AgendaDayGroup({ date, events, multiDayEvents, commitments }: IProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  const sortedCommitments = [...commitments].sort((a, b) => {
    if (a.rawCommitment?.allDay) return -1;
    if (b.rawCommitment?.allDay) return 1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const todayDate = isToday(date);
  const totalItems = events.length + multiDayEvents.length + commitments.length;

  return (
    <div className="space-y-3">
      {/* Day header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-background/95 backdrop-blur-sm py-2 border-b">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              todayDate
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {format(date, "d")}
          </div>
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold capitalize truncate", todayDate && "text-primary")}>
              {format(date, "EEEE", { locale: dateLocale })}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(date, "MMMM 'de' yyyy", { locale: dateLocale })}
            </p>
          </div>
        </div>
        {totalItems > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {totalItems} {totalItems === 1 ? "item" : "itens"}
          </span>
        )}
      </div>

      <div className="space-y-2 pl-1">
        {/* Compromissos do dia */}
        {sortedCommitments.map((commitment) => {
          const isBusy = commitment.rawCommitment?.availability !== "available";
          const isAllDay = commitment.rawCommitment?.allDay;

          return (
            <EventDetailsPopover key={`commitment-${commitment.id}`} event={commitment}>
              <div
                role="button"
                tabIndex={0}
                className={cn(
                  "flex select-none items-center gap-3 rounded-md border border-dashed p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isBusy
                    ? "border-muted-foreground/30 bg-muted/40 text-muted-foreground"
                    : "border-green-300/60 bg-green-50/50 text-green-700 dark:border-green-800/60 dark:bg-green-950/30 dark:text-green-400"
                )}
                style={
                  isBusy
                    ? {
                        backgroundImage:
                          "repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(0,0,0,0.025) 8px, rgba(0,0,0,0.025) 16px)",
                      }
                    : undefined
                }
              >
                <Lock className="size-3.5 shrink-0 opacity-60" />
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <p className="font-medium truncate">{commitment.title}</p>
                  <p className="text-xs opacity-70">
                    {commitment.user.name} ·{" "}
                    {isAllDay
                      ? "Dia todo"
                      : `${format(parseISO(commitment.startDate), "HH:mm")} – ${format(parseISO(commitment.endDate), "HH:mm")}`}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                    isBusy
                      ? "bg-muted-foreground/15 text-muted-foreground"
                      : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  )}
                >
                  {isBusy ? "Indisponível" : "Disponível"}
                </span>
              </div>
            </EventDetailsPopover>
          );
        })}

        {/* Consultas multi-dia */}
        {multiDayEvents.map((event) => {
          const eventStart = startOfDay(parseISO(event.startDate));
          const eventEnd = startOfDay(parseISO(event.endDate));
          const currentDate = startOfDay(date);
          const eventTotalDays = differenceInDays(eventEnd, eventStart) + 1;
          const eventCurrentDay = differenceInDays(currentDate, eventStart) + 1;
          return (
            <AgendaEventCard
              key={event.id}
              event={event}
              eventCurrentDay={eventCurrentDay}
              eventTotalDays={eventTotalDays}
            />
          );
        })}

        {/* Consultas do dia */}
        {sortedEvents.map((event) => (
          <AgendaEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
