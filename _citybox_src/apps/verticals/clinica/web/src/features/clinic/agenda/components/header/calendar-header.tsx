'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";

import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";

import { DatePicker } from "@citybox/ui/molecules";
import { UserSelect } from "@/features/clinic/agenda/components/header/user-select";
import { TodayButton } from "@/features/clinic/agenda/components/header/today-button";
import { DateNavigator } from "@/features/clinic/agenda/components/header/date-navigator";
import { ReturnAlertPopover } from "@/features/clinic/agenda/components/header/return-alert";
import { FitInPopover } from "@/features/clinic/agenda/components/header/fit-in";

import type { TCalendarView } from "@/features/clinic/agenda/types";
import { ButtonNewScheduling } from "../../button-new-scheduling";

const viewOptions: { value: TCalendarView; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
  { value: "agenda", label: "Agenda" },
];

export function CalendarHeader() {
  const { view, setView, selectedDate, setSelectedDate } = useCalendar();

  function handleViewChange(value: string) {
    setView(value as TCalendarView);
  }

  return (
    <div className="flex flex-col gap-3 border-b p-3 sm:p-4 lg:flex-row lg:items-center lg:gap-4">
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1 lg:flex-none lg:shrink-0">
          <UserSelect />
        </div>
        <div className="shrink-0 lg:hidden">
          <ButtonNewScheduling compact />
        </div>
      </div>

      {/*
        Mobile: wrap — evita justify-end + overflow cortar Hoje / setas / data / Dia.
        lg+: barra alinhada à direita sem clip.
      */}
      <div className="flex min-w-0 flex-wrap items-center gap-2 lg:flex-1 lg:flex-nowrap lg:justify-end">
        <TodayButton />
        <DateNavigator />
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          className="w-[9.5rem] shrink-0 sm:w-40"
        />
        <Select value={view} onValueChange={handleViewChange}>
          <SelectTrigger className="w-[7.5rem] shrink-0 sm:w-32">
            <SelectValue placeholder="Visualização" />
          </SelectTrigger>
          <SelectContent>
            {viewOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FitInPopover />
        <ReturnAlertPopover />

        <div className="hidden shrink-0 lg:block">
          <ButtonNewScheduling />
        </div>
      </div>
    </div>
  );
}
