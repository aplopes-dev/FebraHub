"use client";

import { createContext, useContext, useState, useTransition } from "react";

import type { Dispatch, SetStateAction } from "react";
import { IEvent, IUser } from "../interfaces";
import {
  TBadgeVariant,
  TCalendarView,
  TVisibleHours,
  TWorkingHours,
} from "../types";

interface ICalendarContext {
  selectedDate: Date;
  setSelectedDate: (date: Date | undefined) => void;
  selectedUserId: IUser["id"] | "all";
  setSelectedUserId: (userId: IUser["id"] | "all") => void;
  badgeVariant: TBadgeVariant;
  setBadgeVariant: (variant: TBadgeVariant) => void;
  users: IUser[];
  setUsers: Dispatch<SetStateAction<IUser[]>>;
  workingHours: TWorkingHours;
  setWorkingHours: Dispatch<SetStateAction<TWorkingHours>>;
  visibleHours: TVisibleHours;
  setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>;
  events: IEvent[];
  setLocalEvents: Dispatch<SetStateAction<IEvent[]>>;
  view: TCalendarView;
  setView: (view: TCalendarView) => void;
  isViewLoading: boolean;
  isCalendarLoading: boolean;
  setIsCalendarLoading: Dispatch<SetStateAction<boolean>>;
}

const CalendarContext = createContext({} as ICalendarContext);

const WORKING_HOURS = {
  0: { from: 0, to: 0 },
  1: { from: 8, to: 17 },
  2: { from: 8, to: 17 },
  3: { from: 8, to: 17 },
  4: { from: 8, to: 17 },
  5: { from: 8, to: 17 },
  6: { from: 8, to: 12 },
};

const VISIBLE_HOURS: TVisibleHours = {
  from: 7,
  to: 18,
  fromMinutes: 7 * 60,
  toMinutes: 18 * 60,
};

export function CalendarProvider({
  children,
  users: initialUsers = [],
  events: initialEvents = [],
}: {
  children: React.ReactNode;
  users?: IUser[];
  events?: IEvent[];
}) {
  const [badgeVariant, setBadgeVariant] = useState<TBadgeVariant>("colored");
  const [visibleHours, setVisibleHours] =
    useState<TVisibleHours>(VISIBLE_HOURS);
  const [workingHours, setWorkingHours] =
    useState<TWorkingHours>(WORKING_HOURS);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<IUser["id"] | "all">(
    "all"
  );
  const [view, setViewState] = useState<TCalendarView>("day");
  const [isViewLoading, startViewTransition] = useTransition();
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);

  const setView = (newView: TCalendarView) => {
    startViewTransition(() => {
      setViewState(newView);
    });
  };

  const [localEvents, setLocalEvents] = useState<IEvent[]>(initialEvents);
  const [users, setUsers] = useState<IUser[]>(initialUsers);

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate: handleSelectDate,
        selectedUserId,
        setSelectedUserId,
        badgeVariant,
        setBadgeVariant,
        users,
        setUsers,
        visibleHours,
        setVisibleHours,
        workingHours,
        setWorkingHours,
        events: localEvents,
        setLocalEvents,
        view,
        setView,
        isViewLoading,
        isCalendarLoading,
        setIsCalendarLoading,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (!context)
    throw new Error("useCalendar must be used within a CalendarProvider.");
  return context;
}
