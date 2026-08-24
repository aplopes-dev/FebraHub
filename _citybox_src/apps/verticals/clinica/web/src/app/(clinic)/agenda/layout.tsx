import { Suspense } from "react";

import { CalendarProvider } from "@/features/clinic/agenda/contexts/calendar-context";
import { SchedulingSheetProvider } from "@/features/clinic/agenda/contexts/scheduling-sheet-context";
import { SchedulingSheet } from "@/features/clinic/agenda/components/scheduling-sheet";
import { SchedulingSheetIntentListener } from "@/features/clinic/agenda/components/scheduling-sheet-intent-listener";
import { AgendaDateQueryListener } from "@/features/clinic/agenda/components/agenda-date-query-listener";
import { CalendarDataLoader } from "@/features/clinic/agenda/components/calendar-data-loader";

export default function ClinicAgendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CalendarProvider>
      <CalendarDataLoader />
      <SchedulingSheetProvider>
        <Suspense fallback={null}>
          <AgendaDateQueryListener />
        </Suspense>
        <SchedulingSheetIntentListener />
        <Suspense fallback={<div className="p-4">Carregando agenda...</div>}>
          <div className="flex flex-1 flex-col">{children}</div>
        </Suspense>
        <SchedulingSheet />
      </SchedulingSheetProvider>
    </CalendarProvider>
  );
}
