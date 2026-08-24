import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import { fetchDashboardSummary } from '../services/dashboard.api.service';
import { DASHBOARD_QUERY_FRESHNESS } from '../lib/dashboard-query-options';

export const dashboardSummaryKeys = {
  all: (clinicId: string) => ['clinic-dashboard-summary', clinicId] as const,
};

export function useDashboardSummaryQuery(options?: { enabled?: boolean }) {
  const { clinicId, isReady } = useClinicId();
  const enabled = options?.enabled ?? true;

  const query = useQuery({
    queryKey: dashboardSummaryKeys.all(clinicId),
    queryFn: () => fetchDashboardSummary(clinicId),
    enabled: isReady && enabled,
    ...DASHBOARD_QUERY_FRESHNESS,
  });

  return {
    ...query,
    overdueIncomeTotalCents: query.data?.overdueIncomeTotalCents ?? 0,
    openRejectedBudgetsTotalCents:
      query.data?.openRejectedBudgetsTotalCents ?? 0,
    upcomingBirthdaysCount: query.data?.upcomingBirthdaysCount ?? 0,
    isLoading: enabled && (query.isLoading || !isReady),
    isError: query.isError,
  };
}
