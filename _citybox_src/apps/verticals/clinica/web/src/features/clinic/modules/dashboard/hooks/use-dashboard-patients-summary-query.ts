import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import { fetchDashboardPatientsSummary } from '../services/dashboard.api.service';
import type { DashboardPatientsSummary } from '../types/clinic-dashboard';
import { DASHBOARD_QUERY_FRESHNESS } from '../lib/dashboard-query-options';

export const EMPTY_DASHBOARD_PATIENTS_SUMMARY: DashboardPatientsSummary = {
  totalRegisteredCount: 0,
  seenLast6MonthsCount: 0,
  overdueDebtsPatientsCount: 0,
  newSeenThisMonthCount: 0,
  openTreatmentWithoutAppointmentCount: 0,
};

export const dashboardPatientsSummaryKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-patients-summary', clinicId] as const,
};

export function useDashboardPatientsSummaryQuery(options?: {
  enabled?: boolean;
}) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardPatientsSummaryKeys.all(clinicId),
    queryFn: () => fetchDashboardPatientsSummary(clinicId),
    enabled,
    ...DASHBOARD_QUERY_FRESHNESS,
  });

  return {
    ...query,
    summary: query.data ?? EMPTY_DASHBOARD_PATIENTS_SUMMARY,
    isLoading: query.isLoading || (enabled && !isReady),
    isError: query.isError,
  };
}
