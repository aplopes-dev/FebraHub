"use client";

import { useMemo } from "react";
import { isSameDay, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";

import { Loader2 } from "lucide-react";
import { DndProviderWrapper } from "@/features/clinic/agenda/components/dnd/dnd-provider";

import { CalendarHeader } from "@/features/clinic/agenda/components/header/calendar-header";
import { CalendarYearView } from "@/features/clinic/agenda/components/year-view/calendar-year-view";
import { CalendarMonthView } from "@/features/clinic/agenda/components/month-view/calendar-month-view";
import { CalendarAgendaView } from "@/features/clinic/agenda/components/agenda-view/calendar-agenda-view";
import { CalendarDayView } from "@/features/clinic/agenda/components/week-and-day-view/calendar-day-view";
import { CalendarDayViewAllUsers } from "@/features/clinic/agenda/components/week-and-day-view/calendar-day-view-all-users";
import { CalendarWeekView } from "@/features/clinic/agenda/components/week-and-day-view/calendar-week-view";
import { CalendarWeekViewAllUsers } from "@/features/clinic/agenda/components/week-and-day-view/calendar-week-view-all-users";

export function ClientContainer() {
  const {
    selectedDate,
    selectedUserId,
    events,
    view,
    isViewLoading,
    isCalendarLoading,
  } = useCalendar();

  const filteredEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) {
      return [];
    }

    return events.filter((event) => {
      const eventStartDate = parseISO(event.startDate);
      const eventEndDate = parseISO(event.endDate);

      if (view === "year") {
        const yearStart = new Date(selectedDate.getFullYear(), 0, 1);
        const yearEnd = new Date(
          selectedDate.getFullYear(),
          11,
          31,
          23,
          59,
          59,
          999
        );
        const isInSelectedYear =
          eventStartDate <= yearEnd && eventEndDate >= yearStart;
        const isUserMatch =
          selectedUserId === "all" || event.user.id === selectedUserId;
        return isInSelectedYear && isUserMatch;
      }

      if (view === "month" || view === "agenda") {
        const monthStart = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        );
        const monthEnd = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        const isInSelectedMonth =
          eventStartDate <= monthEnd && eventEndDate >= monthStart;
        const isUserMatch =
          selectedUserId === "all" || event.user.id === selectedUserId;
        return isInSelectedMonth && isUserMatch;
      }

      if (view === "week") {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

        const isInSelectedWeek =
          eventStartDate <= weekEnd && eventEndDate >= weekStart;
        const isUserMatch =
          selectedUserId === "all" || event.user.id === selectedUserId;
        return isInSelectedWeek && isUserMatch;
      }

      if (view === "day") {
        const dayStart = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          0,
          0,
          0
        );
        const dayEnd = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          23,
          59,
          59
        );
        const isInSelectedDay =
          eventStartDate <= dayEnd && eventEndDate >= dayStart;
        const isUserMatch =
          selectedUserId === "all" || event.user.id === selectedUserId;
        return isInSelectedDay && isUserMatch;
      }
    });
  }, [selectedDate, selectedUserId, events, view]);

  // Separa compromissos de consultas para tratamento visual distinto
  const appointmentEvents = filteredEvents.filter(
    (e) => e.eventType !== "commitment"
  );
  const commitmentEvents = filteredEvents.filter(
    (e) => e.eventType === "commitment"
  );

  // Multi-day row exibe apenas consultas (não compromissos)
  const singleDayEvents = appointmentEvents.filter((event) => {
    const startDate = parseISO(event.startDate);
    const endDate = parseISO(event.endDate);
    return isSameDay(startDate, endDate);
  });

  const multiDayEvents = appointmentEvents.filter((event) => {
    const startDate = parseISO(event.startDate);
    const endDate = parseISO(event.endDate);
    return !isSameDay(startDate, endDate);
  });

  // For year view, we only care about the start date
  // by using the same date for both start and end,
  // we ensure only the start day will show a dot
  const eventStartDates = useMemo(() => {
    return filteredEvents.map((event) => ({
      ...event,
      endDate: event.startDate,
    }));
  }, [filteredEvents]);

  return (
    <div className="overflow-hidden rounded-xl border">
      <CalendarHeader />

      <div className="relative">
        {(isViewLoading || isCalendarLoading) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-sm font-medium">Carregando...</span>
            </div>
          </div>
        )}

        <DndProviderWrapper>
          {view === "day" && selectedUserId === "all" && (
            <CalendarDayViewAllUsers
              singleDayEvents={singleDayEvents}
              multiDayEvents={multiDayEvents}
              commitments={commitmentEvents}
            />
          )}
          {view === "day" && selectedUserId !== "all" && (
            <CalendarDayView
              singleDayEvents={singleDayEvents}
              multiDayEvents={multiDayEvents}
              commitments={commitmentEvents}
            />
          )}
          {view === "month" && (
            <CalendarMonthView
              singleDayEvents={singleDayEvents}
              multiDayEvents={multiDayEvents}
            />
          )}
          {view === "week" && selectedUserId === "all" && (
            <CalendarWeekViewAllUsers
              singleDayEvents={singleDayEvents}
              multiDayEvents={multiDayEvents}
              commitments={commitmentEvents}
            />
          )}
          {view === "week" && selectedUserId !== "all" && (
            <CalendarWeekView
              singleDayEvents={singleDayEvents}
              multiDayEvents={multiDayEvents}
              commitments={commitmentEvents}
            />
          )}
          {view === "year" && <CalendarYearView allEvents={eventStartDates} />}
          {view === "agenda" && (
            <CalendarAgendaView
              singleDayEvents={singleDayEvents}
              multiDayEvents={multiDayEvents}
              commitments={commitmentEvents}
            />
          )}
        </DndProviderWrapper>
      </div>
    </div>
  );
}
