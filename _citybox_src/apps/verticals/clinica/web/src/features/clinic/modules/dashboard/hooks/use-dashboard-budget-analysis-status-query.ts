import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardBudgetAnalysisStatus,
  type DashboardBudgetAnalysisStatusParams,
} from '../services/dashboard.api.service';
import type { DashboardBudgetAnalysisStatusResult } from '../types/clinic-dashboard';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardBudgetAnalysisStatusKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-budget-analysis-status', clinicId] as const,
  detail: (clinicId: string, params: DashboardBudgetAnalysisStatusParams) =>
    [...dashboardBudgetAnalysisStatusKeys.all(clinicId), params] as const,
};

const EMPTY_STATUS: DashboardBudgetAnalysisStatusResult = {
  summary: {
    open: { count: 0, totalCents: 0 },
    approved: { count: 0, totalCents: 0 },
    rejected: { count: 0, totalCents: 0 },
    totalCount: 0,
    approvalRate: 0,
  },
  timeline: [],
  professionals: [],
  years: [],
};

export function useDashboardBudgetAnalysisStatusQuery(
  params: DashboardBudgetAnalysisStatusParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardBudgetAnalysisStatusKeys.detail(clinicId, params),
    queryFn: () => fetchDashboardBudgetAnalysisStatus(clinicId, params),
    enabled,
    ...DASHBOARD_QUERY_WITH_PLACEHOLDER,
  });

  return {
    ...query,
    data: query.data ?? EMPTY_STATUS,
    isLoading: query.isLoading || (enabled && !isReady),
    isError: query.isError,
  };
}
