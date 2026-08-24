import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardRevenueAnalysis,
  type DashboardRevenueAnalysisParams,
} from '../services/dashboard.api.service';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardRevenueAnalysisKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-revenue-analysis', clinicId] as const,
  list: (clinicId: string, params: DashboardRevenueAnalysisParams) =>
    [...dashboardRevenueAnalysisKeys.all(clinicId), params] as const,
};

export function useDashboardRevenueAnalysisQuery(
  params: DashboardRevenueAnalysisParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardRevenueAnalysisKeys.list(clinicId, params),
    queryFn: () => fetchDashboardRevenueAnalysis(clinicId, params),
    enabled,
    ...DASHBOARD_QUERY_WITH_PLACEHOLDER,
  });

  return {
    ...query,
    items: query.data ?? [],
    isLoading: query.isLoading || (enabled && !isReady),
    isError: query.isError,
  };
}
