import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  EMPTY_DASHBOARD_FINANCIAL_SUMMARY,
} from '../lib/dashboard-financial';
import {
  fetchDashboardFinancialSummary,
  type DashboardFinancialSummaryParams,
} from '../services/dashboard.api.service';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardFinancialSummaryKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-financial-summary', clinicId] as const,
  month: (clinicId: string, params: DashboardFinancialSummaryParams) =>
    [...dashboardFinancialSummaryKeys.all(clinicId), params] as const,
};

export function useDashboardFinancialSummaryQuery(
  params: DashboardFinancialSummaryParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardFinancialSummaryKeys.month(clinicId, params),
    queryFn: () => fetchDashboardFinancialSummary(clinicId, params),
    enabled,
    ...DASHBOARD_QUERY_WITH_PLACEHOLDER,
  });

  return {
    ...query,
    summary: query.data ?? EMPTY_DASHBOARD_FINANCIAL_SUMMARY,
    isLoading: query.isLoading || (enabled && !isReady),
    isError: query.isError,
  };
}
