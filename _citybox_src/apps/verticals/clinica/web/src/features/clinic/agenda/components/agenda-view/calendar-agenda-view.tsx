import { useMemo } from "react";
import { CalendarX2 } from "lucide-react";
import { parseISO, format, endOfDay, startOfDay, isSameMonth } from "date-fns";

import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";

import { ScrollArea } from "@citybox/ui/atoms";
import { AgendaDayGroup } from "@/features/clinic/agenda/components/agenda-view/agenda-day-group";

import { getCommitmentsForDay } from "@/features/clinic/agenda/helpers";

import type { IEvent } from "@/features/clinic/agenda/interfaces";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
  commitments: IEvent[];
}

export function CalendarAgendaView({
  singleDayEvents,
  multiDayEvents,
  commitments,
}: IProps) {
  const { selectedDate } = useCalendar();

  const eventsByDay = useMemo(() => {
    const allDates = new Map<
      string,
      { date: Date; events: IEvent[]; multiDayEvents: IEvent[]; commitments: IEvent[] }
    >();

    const ensureDay = (dateKey: string, date: Date) => {
      if (!allDates.has(dateKey)) {
        allDates.set(dateKey, { date, events: [], multiDayEvents: [], commitments: [] });
      }
      return allDates.get(dateKey)!;
    };

    singleDayEvents.forEach((event) => {
      const eventDate = parseISO(event.startDate);
      if (!isSameMonth(eventDate, selectedDate)) return;
      const dateKey = format(eventDate, "yyyy-MM-dd");
      ensureDay(dateKey, startOfDay(eventDate)).events.push(event);
    });

    multiDayEvents.forEach((event) => {
      const eventStart = parseISO(event.startDate);
      const eventEnd = parseISO(event.endDate);
      let currentDate = startOfDay(eventStart);
      const lastDate = endOfDay(eventEnd);
      while (currentDate <= lastDate) {
        if (isSameMonth(currentDate, selectedDate)) {
          const dateKey = format(currentDate, "yyyy-MM-dd");
          ensureDay(dateKey, new Date(currentDate)).multiDayEvents.push(event);
        }
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
      }
    });

    // Inclui dias com compromissos no mês
    commitments.forEach((commitment) => {
      const startStr = commitment.rawCommitment?.allDay
        ? (commitment.rawCommitment.startDate as string).substring(0, 10)
        : format(parseISO(commitment.startDate), "yyyy-MM-dd");
      const endStr = commitment.rawCommitment?.allDay
        ? (commitment.rawCommitment.endDate as string).substring(0, 10)
        : format(parseISO(commitment.endDate), "yyyy-MM-dd");

      let cursor = new Date(startStr + "T00:00:00");
      const endCursor = new Date(endStr + "T00:00:00");
      while (cursor <= endCursor) {
        if (isSameMonth(cursor, selectedDate)) {
          const dateKey = format(cursor, "yyyy-MM-dd");
          ensureDay(dateKey, new Date(cursor));
        }
        cursor = new Date(cursor.setDate(cursor.getDate() + 1));
      }
    });

    const sorted = Array.from(allDates.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    // Anexa compromissos filtrados por dia
    return sorted.map((group) => ({
      ...group,
      commitments: getCommitmentsForDay(commitments, group.date),
    }));
  }, [singleDayEvents, multiDayEvents, commitments, selectedDate]);

  const hasAnyEvents =
    singleDayEvents.length > 0 || multiDayEvents.length > 0 || commitments.length > 0;

  return (
    <div className="h-[800px]">
      <ScrollArea className="h-full" type="always">
        <div className="space-y-6 p-4">
          {eventsByDay.map((dayGroup) => (
            <AgendaDayGroup
              key={format(dayGroup.date, "yyyy-MM-dd")}
              date={dayGroup.date}
              events={dayGroup.events}
              multiDayEvents={dayGroup.multiDayEvents}
              commitments={dayGroup.commitments}
            />
          ))}

          {!hasAnyEvents && (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
              <CalendarX2 className="size-10" />
              <p className="text-sm md:text-base">
                Nenhum evento agendado para o mês selecionado
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
