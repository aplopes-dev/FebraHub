import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardBudgetAnalysis,
  type DashboardBudgetAnalysisParams,
} from '../services/dashboard.api.service';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardBudgetAnalysisKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-budget-analysis', clinicId] as const,
  list: (clinicId: string, params: DashboardBudgetAnalysisParams) =>
    [...dashboardBudgetAnalysisKeys.all(clinicId), params] as const,
};

export function useDashboardBudgetAnalysisQuery(
  params: DashboardBudgetAnalysisParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardBudgetAnalysisKeys.list(clinicId, params),
    queryFn: () => fetchDashboardBudgetAnalysis(clinicId, params),
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
