import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CalendarPage } from '@/features/calendar/components/calendar-page';

export const metadata: Metadata = {
  title: 'Agenda',
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="rounded-4xl border border-border/70 bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          Carregando…
        </div>
      }
    >
      <CalendarPage />
    </Suspense>
  );
}
