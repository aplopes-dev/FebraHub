'use client';

import { Can, useCan } from '@/features/clinic/permissions';
import { DashboardPageFrame } from '../../components/dashboard-page-frame';
import { DashboardPatientsCard } from '../../components/dashboard-patients-card';
import { useDashboardSummaryQuery } from '../../hooks/use-dashboard-summary-query';
import { CancelledAppointmentsCard } from '../components/cancelled-appointments-card';

export function ClinicTasksPage() {
  const canReadIndicators = useCan('read', 'Dashboard');
  const {
    upcomingBirthdaysCount,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useDashboardSummaryQuery({ enabled: canReadIndicators });

  return (
    <DashboardPageFrame>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <CancelledAppointmentsCard />
        <Can action="read" subject="Dashboard">
          <DashboardPatientsCard
            upcomingBirthdaysCount={upcomingBirthdaysCount}
            upcomingBirthdaysLoading={summaryLoading}
            upcomingBirthdaysError={summaryError}
          />
        </Can>
      </div>
    </DashboardPageFrame>
  );
}
