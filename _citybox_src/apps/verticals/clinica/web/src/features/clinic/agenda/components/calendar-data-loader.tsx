"use client";

import { useEffect } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";
import { useCalendarApi } from "@/features/clinic/agenda/hooks/use-calendar";
import { calendarResponseToEvents } from "@/features/clinic/agenda/utils/calendar-transform";
import { useTeamMembers } from "@/features/clinic/agenda/api/team";
import { useClinicSettings } from "@/features/clinic/agenda/api/clinic-settings";
import { parseClinicTimeToMinutes } from "@/features/clinic/agenda/helpers";

import type { TCalendarView } from "@/features/clinic/agenda/types";

function getDateRange(
  view: TCalendarView,
  selectedDate: Date
): { startDate: string; endDate: string } {
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  switch (view) {
    case "day":
      return { startDate: fmt(selectedDate), endDate: fmt(selectedDate) };
    case "week":
      return {
        startDate: fmt(startOfWeek(selectedDate, { weekStartsOn: 0 })),
        endDate: fmt(endOfWeek(selectedDate, { weekStartsOn: 0 })),
      };
    case "month":
    case "agenda":
      return {
        startDate: fmt(startOfMonth(selectedDate)),
        endDate: fmt(endOfMonth(selectedDate)),
      };
    case "year":
      return {
        startDate: fmt(startOfYear(selectedDate)),
        endDate: fmt(endOfYear(selectedDate)),
      };
  }
}

export function CalendarDataLoader() {
  const {
    selectedDate,
    view,
    setLocalEvents,
    setUsers,
    setIsCalendarLoading,
    setVisibleHours,
    setWorkingHours,
  } = useCalendar();

  const { data: clinicSettings } = useClinicSettings();

  const { startDate, endDate } = getDateRange(view, selectedDate);

  const { data, isLoading } = useCalendarApi({ startDate, endDate });

  const { data: teamData } = useTeamMembers({ status: "active" });

  useEffect(() => {
    setIsCalendarLoading(isLoading);
  }, [isLoading, setIsCalendarLoading]);

  useEffect(() => {
    if (clinicSettings?.openingTime && clinicSettings?.closingTime) {
      const fromMinutes = parseClinicTimeToMinutes(clinicSettings.openingTime);
      const toMinutes = parseClinicTimeToMinutes(clinicSettings.closingTime);
      const from = Math.floor(fromMinutes / 60);
      const to = Math.floor(toMinutes / 60);

      setVisibleHours({ from, to, fromMinutes, toMinutes });

      const weekdayHours = { from, to: Math.ceil(toMinutes / 60) };
      setWorkingHours({
        0: { from: 0, to: 0 },
        1: weekdayHours,
        2: weekdayHours,
        3: weekdayHours,
        4: weekdayHours,
        5: weekdayHours,
        6: weekdayHours,
      });
    }
  }, [clinicSettings, setVisibleHours, setWorkingHours]);

  useEffect(() => {
    if (!data) return;

    const nameById = new Map(
      (teamData?.professionals ?? []).map((professional) => [
        professional.id,
        professional.name,
      ]),
    );

    setLocalEvents(
      calendarResponseToEvents(data.appointments, data.schedules).map(
        (event) => ({
          ...event,
          user: {
            ...event.user,
            name: event.user.name.trim() || nameById.get(event.user.id) || "",
          },
        }),
      ),
    );
  }, [data, teamData, setLocalEvents]);

  useEffect(() => {
    if (teamData?.professionals) {
      setUsers(
        teamData.professionals.map((p) => ({
          id: p.id,
          name: p.name,
          picturePath: null,
        }))
      );
    }
  }, [teamData, setUsers]);

  return null;
}
